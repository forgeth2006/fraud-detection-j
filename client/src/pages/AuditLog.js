import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const ActionBadge = ({ action }) => {
  const colors = {
    created: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
    blocked: 'bg-red-500/20 text-red-400 border border-red-500/30',
    reviewing: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    flagged: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  };
  const icons = {
    created: '➕',
    approved: '✅',
    blocked: '🚫',
    reviewing: '🔍',
    flagged: '🚨',
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[action]}`}>
      {icons[action]} {action?.toUpperCase()}
    </span>
  );
};

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    search: '',
    page: 1,
    limit: 15,
  });
  const [searchInput, setSearchInput] = useState('');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.search) params.append('transactionId', filters.search);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const [logsRes, statsRes] = await Promise.all([
        api.get(`/audit?${params}`),
        api.get('/audit/stats'),
      ]);

      setLogs(logsRes.data.logs);
      setTotal(logsRes.data.total);
      setPages(logsRes.data.pages);
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-gray-400 mt-1">
          Complete compliance trail — every action recorded permanently
        </p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.totalLogs}</p>
            <p className="text-gray-400 text-xs mt-1">Total Actions</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.created}</p>
            <p className="text-gray-400 text-xs mt-1">Created</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
            <p className="text-gray-400 text-xs mt-1">Approved</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.blocked}</p>
            <p className="text-gray-400 text-xs mt-1">Blocked</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{stats.flagged}</p>
            <p className="text-gray-400 text-xs mt-1">Flagged</p>
          </div>
        </div>
      )}

      {/* Compliance Banner */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6">
        <p className="text-green-400 text-sm font-medium">
          🏛️ PCI-DSS & RBI Compliant Audit Trail
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Every action is permanently recorded with analyst identity, timestamp,
          and IP address — meeting banking regulatory requirements.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 flex gap-4 flex-wrap">

        {/* Search */}
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
            placeholder="Search by Transaction ID..."
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

        <select
          value={filters.action}
          onChange={(e) =>
            setFilters({ ...filters, action: e.target.value, page: 1 })
          }
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="approved">Approved</option>
          <option value="blocked">Blocked</option>
          <option value="reviewing">Reviewing</option>
          <option value="flagged">Flagged</option>
        </select>

        <button
          onClick={() => {
            setFilters({ action: '', search: '', page: 1, limit: 15 });
            setSearchInput('');
          }}
          className="bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg px-4 py-2 text-sm transition"
        >
          Clear
        </button>

        <p className="text-gray-400 text-sm self-center ml-auto">
          {total} total records
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">ACTION</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">TRANSACTION ID</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">PERFORMED BY</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">STATUS CHANGE</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">NOTES</th>
                <th className="text-left text-gray-400 text-xs font-medium px-6 py-4">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400 py-12">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-400 py-12">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
                  >
                    <td className="px-6 py-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-blue-400 font-mono text-sm">
                        {log.transactionId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white text-sm">
                          {log.performedBy?.name || 'System'}
                        </p>
                        <p className="text-gray-500 text-xs capitalize">
                          {log.performedBy?.role || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.previousStatus && log.newStatus ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs capitalize">
                            {log.previousStatus}
                          </span>
                          <span className="text-gray-600">→</span>
                          <span className="text-white text-xs capitalize">
                            {log.newStatus}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-xs">
                        {log.notes || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-xs">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </span>
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
    </Layout>
  );
};

export default AuditLog;