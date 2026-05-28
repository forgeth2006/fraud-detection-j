const Transaction = require('../models/Transaction');

const analyzeFraud = async (transaction) => {
  let riskScore = 0;
  const fraudReasons = [];

  // Rule 1 — Large amount
  if (transaction.amount > 100000) {
    riskScore += 50;
    fraudReasons.push('Transaction amount exceeds ₹1,00,000');
  } else if (transaction.amount > 50000) {
    riskScore += 30;
    fraudReasons.push('Transaction amount exceeds ₹50,000');
  }

  // Rule 2 — Night time transaction
  if (transaction.isNightTime) {
    riskScore += 20;
    fraudReasons.push('Transaction made during night hours (12am–5am)');
  }

  // Rule 3 — Foreign location
  if (transaction.location?.isAbroad) {
    riskScore += 25;
    fraudReasons.push('Transaction made from foreign location');
  }

  // Rule 4 — High risk merchant category
  const highRiskCategories = ['gambling', 'crypto'];
  if (highRiskCategories.includes(transaction.merchantCategory)) {
    riskScore += 30;
    fraudReasons.push(
      `High risk merchant category: ${transaction.merchantCategory}`
    );
  }

  // Rule 5 — Velocity check (3+ transactions in 5 mins from same user)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentTransactions = await Transaction.countDocuments({
    userId: transaction.userId,
    timestamp: { $gte: fiveMinutesAgo },
  });

  if (recentTransactions >= 3) {
    riskScore += 40;
    fraudReasons.push(
      `Velocity attack detected — ${recentTransactions} transactions in last 5 minutes`
    );
  }

  // Rule 6 — Round amount (fraudsters often test with round numbers)
  if (transaction.amount % 1000 === 0 && transaction.amount >= 10000) {
    riskScore += 10;
    fraudReasons.push('Suspiciously round transaction amount');
  }

  // Cap score at 100
  riskScore = Math.min(riskScore, 100);

  // Determine risk level
  let riskLevel = 'low';
  if (riskScore > 70) riskLevel = 'high';
  else if (riskScore > 30) riskLevel = 'medium';

  // Determine if fraud
  const isFraud = riskScore > 70;

  return {
    riskScore,
    riskLevel,
    isFraud,
    fraudReasons,
  };
};

module.exports = { analyzeFraud };