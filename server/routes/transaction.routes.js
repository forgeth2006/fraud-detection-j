const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  getTransactionStats,
} = require('../controllers/transaction.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

router.get('/stats', getTransactionStats);
router.get('/', getAllTransactions);
router.post('/', createTransaction);
router.get('/:id', getTransactionById);
router.patch('/:id/status', updateTransactionStatus);

module.exports = router;