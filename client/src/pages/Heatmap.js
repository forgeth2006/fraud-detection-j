import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import api from '../utils/api';

const Heatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [hoveredCell, setHoveredCell] = useState(null);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await api.get('/transactions/heatmap');
        setHeatmapData(res.data.heatmap);
        setTotal(res.data.total);
      } catch (err) {
        console.error('Failed to fetch heatmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  const getCell = (day, hour) => {
    return (
      heatmapData.find((d) => d.day === day && d.hour === hour) || {
        count: 0,
        avgRisk: 0,
      }
    );
  };

  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1);

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-800';
    const intensity = count / maxCount;
    if (intensity < 0.2) return 'bg-red-900/40';
    if (intensity < 0.4) return 'bg-red-800/60';
    if (intensity < 0.6) return 'bg-red-700/70';
    if (intensity < 0.8) return 'bg-red-600/80';
    return 'bg-red-500';
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
  };

  if (loading) {
    return (
      <Layout>
        <Spinner text="Building heatmap..." />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Risk Heatmap</h1>
        <p className="text-gray-400 mt-1">
          Fraud attempt patterns by hour and day of week
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
        <p className="text-blue-400 text-sm font-medium mb-1">
          📊 How to read this heatmap
        </p>
        <p className="text-gray-400 text-sm">
          Each cell represents one hour of one day. Darker red = more suspicious
          transactions detected at that time. Use this to identify peak fraud
          windows and allocate analyst resources accordingly.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{total}</p>
          <p className="text-gray-400 text-xs mt-1">Suspicious Transactions</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">168</p>
          <p className="text-gray-400 text-xs mt-1">Hours Monitored</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {heatmapData.filter((d) => d.count > 0).length}
          </p>
          <p className="text-gray-400 text-xs mt-1">Active Time Slots</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6 overflow-x-auto">
        <div className="min-w-max">
          {/* Hour labels */}
          <div className="flex mb-2 ml-12">
            {hours.map((hour) => (
              <div
                key={hour}
                className="w-8 text-center text-gray-500 text-xs"
              >
                {hour % 3 === 0 ? formatHour(hour) : ''}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {days.map((day) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-12 text-gray-400 text-xs font-medium">
                {day}
              </div>
              {hours.map((hour) => {
                const cell = getCell(day, hour);
                const isHovered =
                  hoveredCell?.day === day && hoveredCell?.hour === hour;
                return (
                  <div
                    key={hour}
                    className={`w-8 h-8 rounded-sm mx-0.5 cursor-pointer transition-all ${getColor(
                      cell.count
                    )} ${isHovered ? 'ring-2 ring-white/50 scale-110' : ''}`}
                    onMouseEnter={() =>
                      setHoveredCell({ day, hour, ...cell })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-6">
          <span className="text-gray-400 text-xs">Less fraud</span>
          <div className="flex gap-1">
            <div className="w-6 h-4 bg-gray-800 rounded-sm" />
            <div className="w-6 h-4 bg-red-900/40 rounded-sm" />
            <div className="w-6 h-4 bg-red-800/60 rounded-sm" />
            <div className="w-6 h-4 bg-red-700/70 rounded-sm" />
            <div className="w-6 h-4 bg-red-600/80 rounded-sm" />
            <div className="w-6 h-4 bg-red-500 rounded-sm" />
          </div>
          <span className="text-gray-400 text-xs">More fraud</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && hoveredCell.count > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 z-50">
          <p className="text-white text-sm font-medium">
            {hoveredCell.day} at {formatHour(hoveredCell.hour)}
          </p>
          <p className="text-gray-400 text-xs">
            {hoveredCell.count} suspicious transaction
            {hoveredCell.count > 1 ? 's' : ''}
          </p>
          <p className="text-red-400 text-xs">
            Avg Risk Score: {hoveredCell.avgRisk}/100
          </p>
        </div>
      )}

      {/* Peak Times Analysis */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">
          🔍 Peak Fraud Windows
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heatmapData
            .filter((d) => d.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map((cell, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-800 rounded-xl p-3"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {cell.day} at {formatHour(cell.hour)}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Avg Risk: {cell.avgRisk}/100
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">{cell.count}</p>
                  <p className="text-gray-500 text-xs">alerts</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Layout>
  );
};

export default Heatmap;