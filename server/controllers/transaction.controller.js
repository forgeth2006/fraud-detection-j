const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const { analyzeFraud } = require('../services/fraudEngine');
const { explainFraud } = require('../services/claudeAI');
const { getMLPrediction } = require('../services/mlService');

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const {
      transactionId,
      userId,
      amount,
      merchantName,
      merchantCategory,
      location,
      deviceType,
      ipAddress,
    } = req.body;

    // Check if transaction already exists
    const existing = await Transaction.findOne({ transactionId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already exists',
      });
    }

    // Check if night time (12am to 5am)
    const hour = new Date().getHours();
    const isNightTime = hour >= 0 && hour <= 5;

    // Create transaction first
    const transaction = await Transaction.create({
      transactionId,
      userId,
      amount,
      merchantName,
      merchantCategory,
      location,
      deviceType,
      ipAddress,
      isNightTime,
    });

    // Run fraud analysis (rule engine)
    const fraudResult = await analyzeFraud(transaction);

    // Run ML prediction
    const mlResult = await getMLPrediction(transaction);

    // Calculate hybrid score
    let finalRiskScore = fraudResult.riskScore;
    let hybridRiskScore = null;

    if (mlResult.mlAvailable) {
      // Hybrid: 40% rule engine + 60% ML model
      hybridRiskScore = Math.round(
        fraudResult.riskScore * 0.4 + mlResult.mlRiskScore * 0.6
      );
      finalRiskScore = hybridRiskScore;
      console.log(
        `Rule Score: ${fraudResult.riskScore} | ML Score: ${mlResult.mlRiskScore} | Hybrid: ${hybridRiskScore}`
      );
    }

    // Determine final risk level
    let finalRiskLevel = 'low';
    if (finalRiskScore > 70) finalRiskLevel = 'high';
    else if (finalRiskScore > 30) finalRiskLevel = 'medium';

    // Update transaction with combined results
    transaction.riskScore = finalRiskScore;
    transaction.riskLevel = finalRiskLevel;
    transaction.isFraud = finalRiskScore > 70;
    transaction.fraudReasons = fraudResult.fraudReasons;
    transaction.mlRiskScore = mlResult.mlAvailable ? mlResult.mlRiskScore : null;
    transaction.mlFraudProbability = mlResult.mlAvailable ? mlResult.fraudProbability : null;
    transaction.hybridRiskScore = hybridRiskScore;
    transaction.mlAvailable = mlResult.mlAvailable;
    transaction.shapExplanation = mlResult.mlAvailable ? mlResult.shapExplanation : null;

    // If high risk — get AI explanation and fire alert
    if (finalRiskLevel === 'high') {
      const aiExplanation = await explainFraud(
        transaction,
        fraudResult.fraudReasons
      );
      transaction.aiExplanation = aiExplanation;

      // Fire real time WebSocket alert
      const io = req.app.get('io');
      io.emit('fraudAlert', {
        type: 'FRAUD_ALERT',
        severity: 'HIGH',
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        merchantName: transaction.merchantName,
        location: transaction.location,
        riskScore: finalRiskScore,
        fraudReasons: fraudResult.fraudReasons,
        aiExplanation: transaction.aiExplanation,
        timestamp: new Date(),
      });

      console.log(`🚨 FRAUD ALERT fired for ${transaction.transactionId}`);
    }

    // Medium risk alert
    if (finalRiskLevel === 'medium') {
      const io = req.app.get('io');
      io.emit('fraudAlert', {
        type: 'REVIEW_ALERT',
        severity: 'MEDIUM',
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        merchantName: transaction.merchantName,
        riskScore: finalRiskScore,
        fraudReasons: fraudResult.fraudReasons,
        timestamp: new Date(),
      });

      console.log(`⚠️ REVIEW ALERT fired for ${transaction.transactionId}`);
    }

    await transaction.save();

    // Save to audit log
    await AuditLog.create({
      action: 'created',
      transactionId: transaction.transactionId,
      performedBy: req.user._id,
      newStatus: 'pending',
      notes: 'Transaction created and pending review',
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/transactions
// @desc    Get all transactions with filters
// @access  Private
const getAllTransactions = async (req, res) => {
  try {
    const {
      status,
      riskLevel,
      merchantCategory,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (merchantCategory) filter.merchantCategory = merchantCategory;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { merchantName: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await Transaction.countDocuments(filter);

    const transactions = await Transaction.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      transactionId: req.params.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   PATCH /api/transactions/:id/status
// @desc    Update transaction status
// @access  Private
const updateTransactionStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const transaction = await Transaction.findOne({
      transactionId: req.params.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const previousStatus = transaction.status;

    transaction.status = status;
    transaction.reviewedBy = req.user._id;
    transaction.reviewedAt = new Date();
    await transaction.save();

    await AuditLog.create({
      action: status,
      transactionId: transaction.transactionId,
      performedBy: req.user._id,
      previousStatus,
      newStatus: status,
      notes: notes || '',
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Transaction ${status} successfully`,
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
const getTransactionStats = async (req, res) => {
  try {
    const total = await Transaction.countDocuments();
    const pending = await Transaction.countDocuments({ status: 'pending' });
    const approved = await Transaction.countDocuments({ status: 'approved' });
    const blocked = await Transaction.countDocuments({ status: 'blocked' });
    const highRisk = await Transaction.countDocuments({ riskLevel: 'high' });
    const mediumRisk = await Transaction.countDocuments({ riskLevel: 'medium' });

    const amountResult = await Transaction.aggregate([
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);
    const totalAmount = amountResult[0]?.totalAmount || 0;

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        blocked,
        highRisk,
        mediumRisk,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/transactions/heatmap
// @desc    Get fraud heatmap data
// @access  Private
const getHeatmapData = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      riskLevel: { $in: ['medium', 'high'] },
    }).select('timestamp riskScore riskLevel');

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const filtered = transactions.filter((txn) => {
          const d = new Date(txn.timestamp);
          return d.getDay() === day && d.getHours() === hour;
        });

        const count = filtered.length;
        const avgRisk =
          filtered.reduce((sum, txn) => sum + txn.riskScore, 0) /
          (count || 1);

        heatmap.push({
          day: days[day],
          dayIndex: day,
          hour,
          count,
          avgRisk: Math.round(avgRisk),
        });
      }
    }

    res.status(200).json({
      success: true,
      heatmap,
      total: transactions.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  getTransactionStats,
  getHeatmapData,
};