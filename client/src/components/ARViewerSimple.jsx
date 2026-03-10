import React, { useEffect, useRef, useState } from 'react';

function ARViewerSimple({ item }) {
  const [arActive, setArActive] = useState(false);
  const [modelScale, setModelScale] = useState('2 2 2');
  const sceneRef = useRef(null);

  // Responsive scale based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let scale;
      if (width < 640) {
        scale = '0.5 0.5 0.5'; // Small mobile
      } else if (width < 768) {
        scale = '0.8 0.8 0.8'; // Mobile
      } else if (width < 1024) {
        scale = '1.2 1.2 1.2'; // Tablet
      } else {
        scale = '2 2 2'; // Desktop
      }
      setModelScale(scale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (arActive) {
      // Load A-Frame and AR.js scripts
      const aframeScript = document.createElement('script');
      aframeScript.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
      document.head.appendChild(aframeScript);

      const arScript = document.createElement('script');
      arScript.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
      document.head.appendChild(arScript);

      return () => {
        document.head.removeChild(aframeScript);
        document.head.removeChild(arScript);
      };
    }
  }, [arActive]);

  const startAR = () => {
    setArActive(true);
  };

  const stopAR = () => {
    setArActive(false);
  };

  if (!arActive) {
    return (
      <div className="relative">
        {/* Preview Image */}
        <div className="relative h-96 bg-gradient-to-b from-blue-100 to-blue-50 rounded-xl overflow-hidden">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-2xl font-bold mb-2">View in AR</h3>
              <p className="text-sm mb-6">See this item on your table</p>
              
              <button
                onClick={startAR}
                className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform"
              >
                🎥 Start AR Camera
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-2">📱 How it works:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Click "Start AR Camera" button</li>
            <li>Allow camera access</li>
            <li>Point camera at a flat surface (table/floor)</li>
            <li>See the {item.name} appear in 3D!</li>
            <li>Walk around to view from all angles</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* AR Scene */}
      <a-scene
        ref={sceneRef}
        embedded
        arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        vr-mode-ui="enabled: false"
      >
        {/* Camera */}
        <a-camera gps-camera rotation-reader></a-camera>

        {/* 3D Model */}
        <a-entity
          gltf-model={item.modelUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'}
          position="0 0 -1.5"
          scale={modelScale}
          rotation="0 0 0"
        ></a-entity>

        {/* Light */}
        <a-light type="ambient" color="#fff" intensity="0.5"></a-light>
        <a-light type="directional" color="#fff" intensity="1" position="1 1 1"></a-light>
      </a-scene>

      {/* Controls Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between text-white">
          <button
            onClick={stopAR}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
          >
            ✕ Exit AR
          </button>
          
          <div className="text-center">
            <p className="text-sm font-semibold">{item.name}</p>
            <p className="text-xs opacity-75">Point at table surface</p>
          </div>
          
          <div className="w-16"></div>
        </div>
      </div>

      {/* Instructions Overlay */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 text-white text-center">
          <p className="text-sm">
            👆 Point your camera at a flat surface
          </p>
        </div>
      </div>
    </div>
  );
}

export default ARViewerSimple;