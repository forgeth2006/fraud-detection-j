const Spinner = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
};

export default Spinner;