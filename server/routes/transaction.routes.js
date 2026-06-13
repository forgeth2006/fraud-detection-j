const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransactionStatus,
  getTransactionStats,
  getHeatmapData,
} = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/stats', getTransactionStats);
router.get('/heatmap', getHeatmapData);
router.get('/', getAllTransactions);
router.post('/', createTransaction);
router.get('/:id', getTransactionById);
router.patch('/:id/status', updateTransactionStatus);

module.exports = router;