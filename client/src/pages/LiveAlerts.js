import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { io } from 'socket.io-client';

const AlertCard = ({ alert }) => {
  const isHigh = alert.severity === 'HIGH';

  return (
    <div className={`border rounded-2xl p-5 mb-4 ${
      isHigh
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-yellow-500/10 border-yellow-500/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isHigh ? '🚨' : '⚠️'}</span>
          <div>
            <p className={`font-bold text-sm ${isHigh ? 'text-red-400' : 'text-yellow-400'}`}>
              {alert.type}
            </p>
            <p className="text-gray-500 text-xs">
              {new Date(alert.timestamp).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          isHigh ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
        }`}>
          {alert.severity}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">Transaction ID</p>
          <p className="text-blue-400 font-mono text-sm">{alert.transactionId}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">Amount</p>
          <p className="text-white font-bold text-sm">
            ₹{alert.amount?.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">Merchant</p>
          <p className="text-white text-sm">{alert.merchantName}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3">
          <p className="text-gray-400 text-xs mb-1">Risk Score</p>
          <p className={`font-bold text-sm ${isHigh ? 'text-red-400' : 'text-yellow-400'}`}>
            {alert.riskScore}/100
          </p>
        </div>
      </div>

      {alert.fraudReasons?.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-400 text-xs mb-2">Fraud Indicators:</p>
          <div className="space-y-1">
            {alert.fraudReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-xs mt-0.5 ${isHigh ? 'text-red-400' : 'text-yellow-400'}`}>•</span>
                <p className="text-gray-300 text-xs">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {alert.aiExplanation && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-400 text-xs font-medium mb-1">🤖 AI Analysis</p>
          <p className="text-gray-300 text-xs leading-relaxed">{alert.aiExplanation}</p>
        </div>
      )}
    </div>
  );
};

const LiveAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected!');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected!');
    });

    socket.on('fraudAlert', (data) => {
      setAlerts((prev) => [data, ...prev]);
      setAlertCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const clearAlerts = () => {
    setAlerts([]);
    setAlertCount(0);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Alerts</h1>
          <p className="text-gray-400 mt-1">Real-time fraud detection feed</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-400">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {alertCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {alertCount} new alerts
            </div>
          )}
          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="bg-gray-800 border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
        <p className="text-blue-400 text-sm font-medium mb-1">
          ⚡ How to trigger a live alert
        </p>
        <p className="text-gray-400 text-sm">
          Send a high-risk transaction via Thunder Client POST to{' '}
          <span className="font-mono text-blue-300">http://localhost:5000/api/transactions</span>
          {' '}with amount {'>'} ₹1,00,000 and isAbroad: true. The alert will appear here instantly!
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-900 border border-gray-800 rounded-2xl">
          <span className="text-5xl mb-4">🛡️</span>
          <p className="text-white font-medium">No alerts yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Watching for suspicious transactions...
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm">System active</span>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-400 text-sm mb-4">
            Showing {alerts.length} alert{alerts.length > 1 ? 's' : ''} — newest first
          </p>
          {alerts.map((alert, index) => (
            <AlertCard key={index} alert={alert} />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default LiveAlerts;