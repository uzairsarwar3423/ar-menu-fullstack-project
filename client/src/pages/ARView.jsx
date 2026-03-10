import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ARViewer from '../components/ARViewer';
import WebAR from '../components/WebAR';
import { menuItems } from '../data/menuData';

function ARView() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [showAR, setShowAR] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show WebAR when active */}
      {showAR && (
        <WebAR 
          item={item} 
          onClose={() => setShowAR(false)} 
        />
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center text-gray-700 hover:text-primary transition"
          >
            <span className="text-2xl mr-2">←</span>
            <span className="font-semibold">Back to Menu</span>
          </button>

          <h1 className="text-xl font-bold text-gray-800">
            AR Preview
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">

          {/* Left: 3D Viewer */}
          <div>
            <h2 className="text-2xl font-bold mb-4">3D Model Preview</h2>

            {/* Three.js Viewer */}
            <ARViewer
              modelUrl={item.modelUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'}
              itemName={item.name}
            />

            {/* AR Button - MAIN ACTION */}
            <button
              onClick={() => setShowAR(true)}
              className="w-full mt-6 bg-gradient-to-r from-primary via-red-500 to-secondary text-white py-5 rounded-xl font-bold text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-200 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center">
                <span className="text-3xl mr-3">📱</span>
                <span>View on Your Table (AR)</span>
              </span>

              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>

            {/* Info */}
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start">
                <span className="text-3xl mr-3">✨</span>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">
                    Experience Real AR!
                  </h3>
                  <p className="text-sm text-blue-800">
                    No app needed! Click the button to activate your camera and see this item appear on your table in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Item Details */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Image */}
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />

              {/* Name */}
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {item.name}
              </h2>

              {/* Urdu Name */}
              <p className="text-xl font-urdu text-gray-600 mb-4">
                {item.nameUrdu}
              </p>

              {/* Category */}
              <div className="inline-block bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                {item.category}
              </div>

              {/* Description */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                {item.description}
              </p>

              {/* Price */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="text-4xl font-bold text-primary">
                    PKR {item.price}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-green-500 text-xl mr-2">✓</span>
                  <span className="text-gray-700">See actual size before ordering</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-green-500 text-xl mr-2">✓</span>
                  <span className="text-gray-700">360° view from all angles</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-green-500 text-xl mr-2">✓</span>
                  <span className="text-gray-700">Works on any smartphone</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-green-500 text-xl mr-2">✓</span>
                  <span className="text-gray-700">No app installation required</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            How AR Works
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-5xl mb-3">📱</div>
              <h3 className="font-bold mb-2">Step 1</h3>
              <p className="text-sm text-gray-600">
                Click "View on Your Table"
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-3">📷</div>
              <h3 className="font-bold mb-2">Step 2</h3>
              <p className="text-sm text-gray-600">
                Allow camera access
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-3">👉</div>
              <h3 className="font-bold mb-2">Step 3</h3>
              <p className="text-sm text-gray-600">
                Point at flat surface
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-3">✨</div>
              <h3 className="font-bold mb-2">Step 4</h3>
              <p className="text-sm text-gray-600">
                See item in 3D!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ARView;