const AuditLog = require('../models/AuditLog');

// @route   GET /api/audit
// @desc    Get all audit logs
// @access  Private (Admin and Analyst)
const getAllAuditLogs = async (req, res) => {
  try {
    const {
      action,
      transactionId,
      performedBy,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter
    const filter = {};
    if (action) filter.action = action;
    if (transactionId) filter.transactionId = transactionId;
    if (performedBy) filter.performedBy = performedBy;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const total = await AuditLog.countDocuments(filter);

    const logs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/audit/:transactionId
// @desc    Get audit logs for a specific transaction
// @access  Private
const getAuditLogsByTransaction = async (req, res) => {
  try {
    const logs = await AuditLog.find({
      transactionId: req.params.transactionId,
    })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: 1 }); // oldest first — shows timeline

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/audit/stats
// @desc    Get audit log statistics
// @access  Admin only
const getAuditStats = async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const flagged = await AuditLog.countDocuments({ action: 'flagged' });
    const approved = await AuditLog.countDocuments({ action: 'approved' });
    const blocked = await AuditLog.countDocuments({ action: 'blocked' });
    const created = await AuditLog.countDocuments({ action: 'created' });

    // Most active analyst
    const analystActivity = await AuditLog.aggregate([
      { $group: { _id: '$performedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalLogs,
        flagged,
        approved,
        blocked,
        created,
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
  getAllAuditLogs,
  getAuditLogsByTransaction,
  getAuditStats,
};