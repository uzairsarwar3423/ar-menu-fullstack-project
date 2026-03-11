import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WebXRAR from '../components/WebXRAR';
import WebAR from '../components/WebAR';
import { menuItems } from '../data/menuData';

function ARView() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [arMode, setArMode] = useState(null); // null = choose, 'webxr' = model-viewer AR, 'camera' = full camera AR

  useEffect(() => {
    const foundItem = menuItems.find(i => i.id === parseInt(itemId));
    if (foundItem) {
      setItem(foundItem);
    } else {
      navigate('/menu');
    }
  }, [itemId, navigate]);

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  // If no AR mode selected, show choice screen
  if (arMode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-3xl font-bold text-white mb-2">{item.name}</h1>
          <p className="text-gray-400">Choose your AR experience</p>
        </div>

        {/* AR Mode Options */}
        <div className="w-full max-w-md space-y-4">
          {/* WebXR AR Option */}
          <button
            onClick={() => setArMode('webxr')}
            className="w-full bg-gradient-to-r from-primary to-secondary p-6 rounded-2xl text-left hover:scale-105 transition transform"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <span className="text-3xl">📱</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Real AR</h3>
                <p className="text-white/80 text-sm">Table detection • Place on surfaces • Works on most devices</p>
              </div>
            </div>
          </button>

          {/* Camera AR Option */}
          <button
            onClick={() => setArMode('camera')}
            className="w-full bg-gray-800 p-6 rounded-2xl text-left hover:scale-105 transition transform border border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-700 p-4 rounded-xl">
                <span className="text-3xl">🎥</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Camera AR</h3>
                <p className="text-gray-400 text-sm">Full camera view • Rotate & zoom model • Works everywhere</p>
              </div>
            </div>
          </button>

          {/* Back Button */}
          <button
            onClick={() => navigate('/menu')}
            className="w-full bg-transparent border border-gray-600 text-gray-400 py-3 rounded-xl hover:text-white hover:border-white transition"
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Show selected AR mode
  if (arMode === 'webxr') {
    return <WebXRAR item={item} onClose={() => navigate('/menu')} />;
  }

  // Camera AR (original WebAR)
  return (
    <WebAR 
      item={item} 
      onClose={() => navigate('/menu')} 
    />
  );
}

export default ARView;

