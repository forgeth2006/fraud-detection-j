const axios = require('axios');

const merchants = [
  { name: 'Amazon India', category: 'retail' },
  { name: 'Flipkart', category: 'retail' },
  { name: 'Zomato', category: 'food' },
  { name: 'Swiggy', category: 'food' },
  { name: 'MakeMyTrip', category: 'travel' },
  { name: 'IndiGo Airlines', category: 'travel' },
  { name: 'Croma Electronics', category: 'electronics' },
  { name: 'WazirX Crypto', category: 'crypto' },
  { name: 'Betway Casino', category: 'gambling' },
  { name: 'Apple Store', category: 'electronics' },
];

const locations = [
  { city: 'Mumbai', country: 'India', isAbroad: false },
  { city: 'Delhi', country: 'India', isAbroad: false },
  { city: 'Bangalore', country: 'India', isAbroad: false },
  { city: 'Thrissur', country: 'India', isAbroad: false },
  { city: 'Dubai', country: 'UAE', isAbroad: true },
  { city: 'London', country: 'UK', isAbroad: true },
  { city: 'Moscow', country: 'Russia', isAbroad: true },
];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getRandomAmount = () => {
  const rand = Math.random();
  if (rand < 0.6) return Math.floor(Math.random() * 5000) + 100;
  if (rand < 0.85) return Math.floor(Math.random() * 50000) + 5000;
  return Math.floor(Math.random() * 150000) + 50000;
};

let counter = 1000;
let token = '';

const login = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'analyst@jpm.com',
      password: 'Fraud123',
    });
    token = res.data.token;
    console.log('✅ Logged in as analyst');
  } catch (err) {
    console.error('Login failed:', err.message);
    process.exit(1);
  }
};

const generateTransaction = async () => {
  const merchant = getRandomItem(merchants);
  const location = getRandomItem(locations);
  const amount = getRandomAmount();

  const transaction = {
    transactionId: `SIM${counter++}`,
    userId: `USER${Math.floor(Math.random() * 50) + 1}`,
    amount,
    merchantName: merchant.name,
    merchantCategory: merchant.category,
    location,
    deviceType: getRandomItem(['mobile', 'web', 'atm', 'pos']),
    ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  };

  try {
    const res = await axios.post(
      'http://localhost:5000/api/transactions',
      transaction,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const txn = res.data.transaction;
    const riskEmoji =
      txn.riskLevel === 'high' ? '🚨' :
      txn.riskLevel === 'medium' ? '⚠️' : '✅';

    console.log(
      `${riskEmoji} ${txn.transactionId} | ₹${txn.amount.toLocaleString('en-IN')} | ${txn.merchantName} | ${txn.location.city} | Risk: ${txn.riskScore}/100`
    );
  } catch (err) {
    console.error('Transaction failed:', err.message);
  }
};

const startSimulator = async () => {
  console.log('🚀 Starting transaction simulator...');
  console.log('Press Ctrl+C to stop\n');

  await login();

  console.log('\n📡 Generating transactions every 3 seconds...\n');

  // Run immediately then every 3 seconds
  await generateTransaction();
  setInterval(generateTransaction, 3000);
};

startSimulator();