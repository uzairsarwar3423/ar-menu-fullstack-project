import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ARViewer from '../components/ARViewer';
import { menuItems } from '../data/menuData';
import '@google/model-viewer';

function ARView() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [showAR, setShowAR] = useState(false);

  useEffect(() => {
    // Find item by ID
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
            AR Viewer
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Left: 3D Viewer */}
          <div>
            <h2 className="text-2xl font-bold mb-4">3D Preview</h2>
            
            {/* Three.js Viewer */}
            <ARViewer 
              modelUrl={item.modelUrl || '/models/sample.glb'} 
              itemName={item.name}
            />
            
            {/* AR Button */}
            <button
              onClick={() => setShowAR(!showAR)}
              className="w-full mt-4 bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {showAR ? '📱 Hide AR View' : '📱 View in AR (Beta)'}
            </button>
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
              <div className="mt-6 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  <span>View in 3D before ordering</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  <span>Realistic size preview</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  <span>Rotate and zoom freely</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AR Mode Section (model-viewer) */}
        {showAR && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">
                Augmented Reality View
              </h2>
              
              <p className="text-gray-600 mb-4">
                Click the AR button below to view this item on your table!
                (Works best on mobile devices)
              </p>
              
              {/* model-viewer AR */}
              <model-viewer
                src={item.modelUrl || '/models/sample.glb'}
                alt={item.name}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                auto-rotate
                environment-image="neutral"
                shadow-intensity="1"
                style={{
                  width: '100%',
                  height: '500px',
                  background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)',
                  borderRadius: '12px'
                }}
              >
                {/* AR Button */}
                <button
                  slot="ar-button"
                  className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-lg font-bold shadow-lg"
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  📱 Activate AR on Your Device
                </button>
                
                {/* Loading */}
                <div slot="progress-bar" style={{ display: 'none' }}></div>
              </model-viewer>
              
              {/* Instructions */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">
                  📱 How to use AR:
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Click "Activate AR on Your Device" button</li>
                  <li>Allow camera access when prompted</li>
                  <li>Point your camera at a flat surface (table/floor)</li>
                  <li>Tap to place the 3D model</li>
                  <li>Walk around to view from different angles!</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ARView;