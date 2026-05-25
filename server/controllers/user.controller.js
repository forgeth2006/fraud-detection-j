const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   PATCH /api/users/:id/deactivate
// @desc    Deactivate a user (Admin only)
// @access  Admin
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Admin can't deactivate themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.email} has been deactivated`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Admin
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const admins = await User.countDocuments({ role: 'admin' });
    const analysts = await User.countDocuments({ role: 'analyst' });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        admins,
        analysts,
        inactiveUsers: totalUsers - activeUsers,
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

module.exports = { getAllUsers, deactivateUser, getUserStats };