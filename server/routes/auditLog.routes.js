const express = require('express');
const router = express.Router();
const {
  getAllAuditLogs,
  getAuditLogsByTransaction,
  getAuditStats,
} = require('../controllers/auditLog.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes protected
router.use(protect);

router.get('/', getAllAuditLogs);
router.get('/stats', getAuditStats);
router.get('/:transactionId', getAuditLogsByTransaction);

module.exports = router;