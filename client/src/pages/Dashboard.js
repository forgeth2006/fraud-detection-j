import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <span className="text-gray-400 text-sm font-medium">{title}</span>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/transactions/stats');
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  // Chart data
  const statusData = [
    { name: 'Pending', value: stats?.pending || 0, color: '#EAB308' },
    { name: 'Approved', value: stats?.approved || 0, color: '#22C55E' },
    { name: 'Blocked', value: stats?.blocked || 0, color: '#EF4444' },
  ];

  const riskData = [
    { name: 'Low Risk', value: stats?.total - stats?.highRisk - stats?.mediumRisk || 0, color: '#22C55E' },
    { name: 'Medium Risk', value: stats?.mediumRisk || 0, color: '#EAB308' },
    { name: 'High Risk', value: stats?.highRisk || 0, color: '#EF4444' },
  ];

  const barData = [
    { name: 'Total', value: stats?.total || 0 },
    { name: 'Pending', value: stats?.pending || 0 },
    { name: 'Approved', value: stats?.approved || 0 },
    { name: 'Blocked', value: stats?.blocked || 0 },
    { name: 'High Risk', value: stats?.highRisk || 0 },
    { name: 'Medium', value: stats?.mediumRisk || 0 },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Real-time fraud monitoring overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Transactions"
          value={stats?.total || 0}
          icon="💳"
          color="text-white"
        />
        <StatCard
          title="Pending Review"
          value={stats?.pending || 0}
          icon="⏳"
          color="text-yellow-400"
        />
        <StatCard
          title="Blocked"
          value={stats?.blocked || 0}
          icon="🚫"
          color="text-red-400"
        />
        <StatCard
          title="High Risk"
          value={stats?.highRisk || 0}
          icon="🚨"
          color="text-red-500"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Approved"
          value={stats?.approved || 0}
          icon="✅"
          color="text-green-400"
        />
        <StatCard
          title="Medium Risk"
          value={stats?.mediumRisk || 0}
          icon="⚠️"
          color="text-yellow-500"
        />
        <StatCard
          title="Total Amount"
          value={`₹${stats?.totalAmount?.toLocaleString('en-IN') || 0}`}
          icon="💰"
          color="text-blue-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Status Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-6">Transaction Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#9CA3AF' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-6">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: '#9CA3AF' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <h3 className="text-white font-semibold mb-6">Transaction Overview</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* JPMorgan Info Banner */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl p-6">
        <h3 className="text-blue-400 font-semibold mb-2">
          🏦 About This System
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          This fraud detection system monitors transactions in real-time using
          a hybrid rule-based engine combined with machine learning. High-risk
          transactions are automatically analysed by AI and flagged for analyst
          review — inspired by JPMorgan Chase's OmniAI fraud detection platform.
        </p>
      </div>
    </Layout>
  );
};

export default Dashboard;