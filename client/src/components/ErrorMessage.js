const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <span className="text-5xl mb-4">⚠️</span>
      <p className="text-red-400 font-medium mb-2">Something went wrong</p>
      <p className="text-gray-400 text-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;