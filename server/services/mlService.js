const axios = require('axios');

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001';

const getMLPrediction = async (transaction) => {
  try {
    const amount = transaction.amount || 0;
    const isAbroad = transaction.location?.isAbroad ? 1 : 0;
    const isNightTime = transaction.isNightTime ? 1 : 0;
    const isHighRiskCategory =
      ['gambling', 'crypto'].includes(transaction.merchantCategory) ? 1 : 0;
    const isRoundAmount = amount % 1000 === 0 && amount >= 10000 ? 1 : 0;

    const payload = {
      amount: amount,
      time: new Date(transaction.timestamp).getHours() * 3600,
      V1: isAbroad * -3.5,
      V2: isNightTime * -2.8,
      V3: isHighRiskCategory * -3.2,
      V4: isRoundAmount * -2.1,
      V5: amount > 100000 ? -3.8 : 0.5,
      V6: amount > 50000 ? -2.5 : 0.3,
      V7: 0.2,
      V8: -0.1,
      V9: 0.3,
      V10: -0.2,
      V11: 0.1,
      V12: -0.3,
      V13: 0.2,
      V14: isAbroad * -4.1,
      V15: 0.1,
      V16: isHighRiskCategory * -2.5,
      V17: isNightTime * -3.1,
      V18: 0.2,
      V19: -0.1,
      V20: 0.3,
      V21: isRoundAmount * -1.8,
      V22: 0.1,
      V23: -0.2,
      V24: 0.1,
      V25: 0.2,
      V26: -0.1,
      V27: 0.1,
      V28: -0.05,
    };

    // Use /explain endpoint for SHAP explanations
    const response = await axios.post(`${ML_API_URL}/explain`, payload, {
      timeout: 10000,
    });

    if (response.data.success) {
      return {
        mlRiskScore: response.data.ml_risk_score,
        fraudProbability: response.data.fraud_probability,
        mlRiskLevel: response.data.risk_level,
        shapExplanation: response.data.shap_explanation,
        mlAvailable: true,
      };
    }

    return { mlAvailable: false };
  } catch (error) {
    console.log('ML API unavailable — using rule engine only');
    return { mlAvailable: false };
  }
};

module.exports = { getMLPrediction };