import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Toast from '../components/Toast';
import api from '../utils/api';

const RiskBadge = ({ level }) => {
  const colors = {
    high: 'bg-red-500/20 text-red-400 border border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    low: 'bg-green-500/20 text-green-400 border border-green-500/30',
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[level]}`}>
      {level?.toUpperCase()}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    blocked: 'bg-red-500/20 text-red-400',
    reviewing: 'bg-blue-500/20 text-blue-400',
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[status]}`}>
      {status?.toUpperCase()}
    </span>
  );
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    riskLevel: '',
    search: '',
    page: 1,
    limit: 10,
  });
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      setError(null);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load transactions. Is your backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const handleStatusUpdate = async (transactionId, status) => {
    try {
      await api.patch(`/transactions/${transactionId}/status`, {
        status,
        notes: `Manually ${status} by analyst`,
      });
      fetchTransactions();
      setSelected(null);
      setToast({
        message: `Transaction ${status} successfully!`,
        type:
          status === 'approved'
            ? 'success'
            : status === 'blocked'
            ? 'error'
            : 'warning',
      });
    } catch (err) {
      setToast({ message: 'Failed to update transaction', type: 'error' });
    }
  };

  if (error) {
    return (
      <Layout>
        <ErrorMessage message={error} onRetry={fetchTransactions} />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-gray-400 mt-1">{total} total transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex gap-4 flex-wrap">

        {/* Search Bar */}
        <div className="flex gap-2 w-full">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setFilters({ ...filters, search: searchInput, page: 1 });
              }
            }}
            placeholder="Search by Transaction ID, Merchant or User..."
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder-gray-500"
          />
          <button
            onClick={() =>
              setFilters({ ...filters, search: searchInput, page: 1 })
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            🔍 Search
          </button>
        </div>

        {/* Dropdowns */}
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value, page: 1 })
          }
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="blocked">Blocked</option>
          <option value="reviewing">Reviewing</option>
        </select>

        <select
          value={filters.riskLevel}
          onChange={(e) =>
            setFilters({ ...filters, riskLevel: e.target.value, page: 1 })
          }
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Risk Levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>

        <button
          onClick={() => {
            setFilters({
              status: '',
              riskLevel: '',
              search: '',
              page: 1,
              limit: 10,
            });
            setSearchInput('');
          }}
          className="bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg px-4 py-2 text-sm transition"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">
                  TRANSACTION ID
                </th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">
                  MERCHANT
                </th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">
                  AMOUNT
                </th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">
                  RISK
                </th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">
                  STATUS
                </th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">
                  DATE
                </th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <Spinner text="Loading transactions..." />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-gray-400 py-12">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr
                    key={txn._id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
                  >
                    <td className="px-6 py-4">
                      <span className="text-blue-400 font-mono text-sm">
                        {txn.transactionId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white text-sm">{txn.merchantName}</p>
                        <p className="text-gray-500 text-xs capitalize">
                          {txn.merchantCategory}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">
                        ₹{txn.amount?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={txn.riskLevel} />
                        <span className="text-gray-500 text-xs">
                          {txn.riskScore}/100
                        </span>
                        {txn.mlAvailable && (
                          <span className="text-purple-400 text-xs">🤖</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">
                        {new Date(txn.timestamp).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelected(txn)}
                        className="text-blue-400 hover:text-blue-300 text-sm transition"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">
          Page {filters.page} of {pages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setFilters({ ...filters, page: filters.page - 1 })
            }
            disabled={filters.page === 1}
            className="bg-gray-900 border border-gray-800 text-gray-400 disabled:opacity-50 px-4 py-2 rounded-lg text-sm hover:text-white transition"
          >
            ← Previous
          </button>
          <button
            onClick={() =>
              setFilters({ ...filters, page: filters.page + 1 })
            }
            disabled={filters.page === pages}
            className="bg-gray-900 border border-gray-800 text-gray-400 disabled:opacity-50 px-4 py-2 rounded-lg text-sm hover:text-white transition"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-lg">
                  Transaction Details
                </h2>
                <p className="text-blue-400 font-mono text-sm">
                  {selected.transactionId}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-white text-2xl transition"
              >
                ×
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Amount</p>
                <p className="text-white font-bold text-lg">
                  ₹{selected.amount?.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Risk Score</p>
                <p
                  className={`font-bold text-lg ${
                    selected.riskLevel === 'high'
                      ? 'text-red-400'
                      : selected.riskLevel === 'medium'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {selected.riskScore}/100
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Merchant</p>
                <p className="text-white text-sm">{selected.merchantName}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Location</p>
                <p className="text-white text-sm">
                  {selected.location?.city}, {selected.location?.country}
                  {selected.location?.isAbroad && ' 🌍'}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Device</p>
                <p className="text-white text-sm capitalize">
                  {selected.deviceType}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Night Time</p>
                <p className="text-white text-sm">
                  {selected.isNightTime ? '🌙 Yes' : '☀️ No'}
                </p>
              </div>
            </div>

            {/* ML Insights Section */}
            {selected.mlAvailable && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                <p className="text-purple-400 font-medium text-sm mb-3">
                  🤖 ML Model Insights
                </p>

                {/* Score Comparison */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">Rule Score</p>
                    <p className="text-yellow-400 font-bold text-lg">
                      {selected.hybridRiskScore
                        ? Math.round(
                            (selected.riskScore - selected.mlRiskScore * 0.6) /
                              0.4
                          )
                        : selected.riskScore}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">ML Score</p>
                    <p className="text-blue-400 font-bold text-lg">
                      {selected.mlRiskScore?.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-gray-400 text-xs mb-1">Hybrid Score</p>
                    <p
                      className={`font-bold text-lg ${
                        selected.hybridRiskScore > 70
                          ? 'text-red-400'
                          : selected.hybridRiskScore > 30
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {selected.hybridRiskScore}
                    </p>
                  </div>
                </div>

                {/* Hybrid formula explanation */}
                <p className="text-gray-500 text-xs mb-3 text-center">
                  Hybrid = Rule Engine (40%) + ML Model (60%)
                </p>

                {/* SHAP Top Features */}
                {selected.shapExplanation?.top_features?.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-2">
                      Top fraud risk factors (SHAP values):
                    </p>
                    <div className="space-y-2">
                      {selected.shapExplanation.top_features
                        .slice(0, 5)
                        .map((feat, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs w-16 shrink-0">
                              {feat.feature}
                            </span>
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  feat.impact === 'increases_fraud_risk'
                                    ? 'bg-red-400'
                                    : 'bg-green-400'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    feat.importance * 200,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-xs w-16 text-right ${
                                feat.impact === 'increases_fraud_risk'
                                  ? 'text-red-400'
                                  : 'text-green-400'
                              }`}
                            >
                              {feat.impact === 'increases_fraud_risk'
                                ? '+'
                                : '-'}
                              {feat.importance.toFixed(3)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Human explanation */}
                    {selected.shapExplanation?.human_explanation && (
                      <p className="text-gray-400 text-xs mt-3 leading-relaxed border-t border-gray-700 pt-3">
                        {selected.shapExplanation.human_explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* ML Fraud Probability */}
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">
                      ML Fraud Probability
                    </span>
                    <span className="text-purple-400 text-xs font-medium">
                      {(selected.mlFraudProbability * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-400"
                      style={{
                        width: `${selected.mlFraudProbability * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Fraud Reasons */}
            {selected.fraudReasons?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-400 font-medium text-sm mb-2">
                  🚨 Fraud Indicators
                </p>
                <ul className="space-y-1">
                  {selected.fraudReasons.map((reason, i) => (
                    <li
                      key={i}
                      className="text-gray-300 text-sm flex items-start gap-2"
                    >
                      <span className="text-red-400 mt-0.5">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Explanation */}
            {selected.aiExplanation && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <p className="text-blue-400 font-medium text-sm mb-2">
                  🤖 AI Analysis
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selected.aiExplanation}
                </p>
              </div>
            )}

            {/* Actions */}
            {selected.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleStatusUpdate(selected.transactionId, 'approved')
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() =>
                    handleStatusUpdate(selected.transactionId, 'blocked')
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition"
                >
                  🚫 Block
                </button>
                <button
                  onClick={() =>
                    handleStatusUpdate(selected.transactionId, 'reviewing')
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition"
                >
                  🔍 Review
                </button>
              </div>
            )}

            {selected.status !== 'pending' && (
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-gray-400 text-sm">
                  This transaction has been{' '}
                  <span className="text-white font-medium">
                    {selected.status}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
};

export default Transactions;