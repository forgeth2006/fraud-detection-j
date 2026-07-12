import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <span className="text-8xl mb-6">🔍</span>
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-400 mb-8">Page not found</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;