const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

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

    const { analyzeFraud } = require('../services/fraudEngine');

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

    // Run fraud analysis
    const fraudResult = await analyzeFraud(transaction);

    // Update transaction with fraud results
    transaction.riskScore = fraudResult.riskScore;
    transaction.riskLevel = fraudResult.riskLevel;
    transaction.isFraud = fraudResult.isFraud;
    transaction.fraudReasons = fraudResult.fraudReasons;
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
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (merchantCategory) filter.merchantCategory = merchantCategory;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Transaction.countDocuments(filter);

    const transactions = await Transaction.find(filter)
      .sort({ timestamp: -1 }) // newest first
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
// @desc    Get single transaction by ID
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
// @desc    Update transaction status (approve or block)
// @access  Private (Analyst or Admin)
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

    // Update transaction
    transaction.status = status;
    transaction.reviewedBy = req.user._id;
    transaction.reviewedAt = new Date();
    await transaction.save();

    // Log this action to audit log
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
// @desc    Get transaction statistics for dashboard
// @access  Private
const getTransactionStats = async (req, res) => {
  try {
    const total = await Transaction.countDocuments();
    const pending = await Transaction.countDocuments({ status: 'pending' });
    const approved = await Transaction.countDocuments({ status: 'approved' });
    const blocked = await Transaction.countDocuments({ status: 'blocked' });
    const highRisk = await Transaction.countDocuments({ riskLevel: 'high' });
    const mediumRisk = await Transaction.countDocuments({ riskLevel: 'medium' });

    // Total amount processed
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

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  getTransactionStats,
};