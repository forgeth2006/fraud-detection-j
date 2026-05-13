const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    merchantName: {
      type: String,
      required: true,
    },
    merchantCategory: {
      type: String,
      enum: [
        'retail',
        'food',
        'travel',
        'electronics',
        'gambling',
        'crypto',
        'other',
      ],
      default: 'other',
    },
    location: {
      city: { type: String },
      country: { type: String, default: 'India' },
      isAbroad: { type: Boolean, default: false },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // Fraud Detection Fields
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    isFraud: {
      type: Boolean,
      default: false,
    },
    fraudReasons: {
      type: [String], // list of reasons why flagged
      default: [],
    },
    aiExplanation: {
      type: String, // Claude AI's explanation
      default: '',
    },
    // Analyst Action Fields
    status: {
      type: String,
      enum: ['pending', 'approved', 'blocked', 'reviewing'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    // Device & Session Info
    deviceType: {
      type: String,
      enum: ['mobile', 'web', 'atm', 'pos'],
      default: 'web',
    },
    ipAddress: {
      type: String,
      default: '',
    },
    isNightTime: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);