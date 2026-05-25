const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  deactivateUser,
  getUserStats,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes below are protected AND admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.patch('/:id/deactivate', deactivateUser);

module.exports = router;