const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Transaction = require('../models/Transaction');
const { analyzeFraud } = require('../services/fraudEngine');

const merchantData = [
  { name: 'Amazon India', category: 'retail' },
  { name: 'Flipkart', category: 'retail' },
  { name: 'Zomato', category: 'food' },
  { name: 'Swiggy', category: 'food' },
  { name: 'MakeMyTrip', category: 'travel' },
  { name: 'IndiGo Airlines', category: 'travel' },
  { name: 'Croma Electronics', category: 'electronics' },
  { name: 'Apple Store', category: 'electronics' },
  { name: 'Betway Casino', category: 'gambling' },
  { name: 'WazirX Crypto', category: 'crypto' },
];

const locations = [
  { city: 'Mumbai', country: 'India', isAbroad: false },
  { city: 'Delhi', country: 'India', isAbroad: false },
  { city: 'Bangalore', country: 'India', isAbroad: false },
  { city: 'Chennai', country: 'India', isAbroad: false },
  { city: 'Thrissur', country: 'India', isAbroad: false },
  { city: 'Dubai', country: 'UAE', isAbroad: true },
  { city: 'London', country: 'UK', isAbroad: true },
  { city: 'New York', country: 'USA', isAbroad: true },
];

const generateTransaction = (index) => {
  const merchant = merchantData[Math.floor(Math.random() * merchantData.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const hour = Math.floor(Math.random() * 24);
  const isNightTime = hour >= 0 && hour <= 5;

  // Mix of amounts — mostly normal, some high
  const amountTypes = [
    faker.number.int({ min: 100, max: 5000 }),    // normal
    faker.number.int({ min: 5000, max: 50000 }),   // medium
    faker.number.int({ min: 50000, max: 200000 }), // high
  ];
  const amountWeights = [0.6, 0.3, 0.1]; // 60% normal, 30% medium, 10% high
  const rand = Math.random();
  let amount;
  if (rand < amountWeights[0]) amount = amountTypes[0];
  else if (rand < amountWeights[0] + amountWeights[1]) amount = amountTypes[1];
  else amount = amountTypes[2];

  return {
    transactionId: `TXN${String(index + 100).padStart(4, '0')}`,
    userId: `USER${faker.number.int({ min: 1, max: 20 })}`,
    amount,
    currency: 'INR',
    merchantName: merchant.name,
    merchantCategory: merchant.category,
    location,
    deviceType: faker.helpers.arrayElement(['mobile', 'web', 'atm', 'pos']),
    ipAddress: faker.internet.ip(),
    isNightTime,
    timestamp: faker.date.recent({ days: 30 }),
  };
};

const seedTransactions = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/fraudDetectionDB');
    console.log('MongoDB Connected...');

    // Clear existing transactions
    await Transaction.deleteMany({});
    console.log('Existing transactions cleared...');

    console.log('Generating 50 transactions...');

    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;

    for (let i = 0; i < 50; i++) {
      const txData = generateTransaction(i);

      // Create transaction
      const transaction = new Transaction(txData);
      await transaction.save();

      // Run fraud analysis
      const fraudResult = await analyzeFraud(transaction);

      // Update with fraud results
      transaction.riskScore = fraudResult.riskScore;
      transaction.riskLevel = fraudResult.riskLevel;
      transaction.isFraud = fraudResult.isFraud;
      transaction.fraudReasons = fraudResult.fraudReasons;

      // Randomly set some as already reviewed
      if (Math.random() > 0.6) {
        const statuses = ['approved', 'blocked'];
        transaction.status = statuses[Math.floor(Math.random() * statuses.length)];
      }

      await transaction.save();

      if (fraudResult.riskLevel === 'high') highRiskCount++;
      else if (fraudResult.riskLevel === 'medium') mediumRiskCount++;
      else lowRiskCount++;

      process.stdout.write(`\rProcessed ${i + 1}/50 transactions...`);
    }

    console.log('\n----------------------------');
    console.log('Seed completed successfully!');
    console.log(`High Risk:   ${highRiskCount}`);
    console.log(`Medium Risk: ${mediumRiskCount}`);
    console.log(`Low Risk:    ${lowRiskCount}`);
    console.log('----------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedTransactions();