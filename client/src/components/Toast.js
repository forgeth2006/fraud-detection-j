import { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };

  return (
    <div className={`fixed bottom-6 right-6 border rounded-xl px-4 py-3 flex items-center gap-3 z-50 shadow-lg ${colors[type]}`}>
      <span>{icons[type]}</span>
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">×</button>
    </div>
  );
};

export default Toast;