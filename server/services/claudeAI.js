require('dotenv').config();
const Groq = require('groq-sdk');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const explainFraud = async (transaction, fraudReasons) => {
  try {
    const transactionContext = `
Transaction Details:
- Transaction ID: ${transaction.transactionId}
- Amount: ₹${transaction.amount.toLocaleString('en-IN')}
- Merchant: ${transaction.merchantName} (${transaction.merchantCategory})
- Location: ${transaction.location.city}, ${transaction.location.country}
- Foreign Transaction: ${transaction.location.isAbroad ? 'Yes' : 'No'}
- Device: ${transaction.deviceType}
- Night Time Transaction: ${transaction.isNightTime ? 'Yes' : 'No'}
- Risk Score: ${transaction.riskScore}/100
- Risk Level: ${transaction.riskLevel.toUpperCase()}

Fraud Indicators Detected:
${fraudReasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}
    `;

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are a senior fraud analyst at JPMorgan Chase. Analyze this suspicious transaction and provide a clear, concise explanation (3-4 sentences) of why it is flagged as high risk. Be specific about the fraud indicators and recommend an action. Write in professional banking language.

${transactionContext}`,
        },
      ],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('AI error full details:', error);
    return 'AI explanation unavailable. Please review manually based on risk indicators.';
  }
};

module.exports = { explainFraud };