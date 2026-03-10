import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';

// 3D Model Component
function Model({ url }) {
  const { scene } = useGLTF(url);
  
  return (
    <primitive 
      object={scene} 
      scale={1.5}
      position={[0, -1, 0]}
    />
  );
}

// Loading Component
function Loader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Loading 3D Model...</p>
      </div>
    </div>
  );
}

// Main AR Viewer Component
function ARViewer({ modelUrl, itemName }) {
  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Environment for reflections */}
        <Environment preset="city" />
        
        {/* 3D Model */}
        <Suspense fallback={null}>
          <Model url={modelUrl} />
        </Suspense>
        
        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
        />
      </Canvas>
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div className="bg-white/90 backdrop-blur-sm inline-block px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm text-gray-700">
            🖱️ Drag to rotate • Scroll to zoom • Right-click to pan
          </p>
        </div>
      </div>
    </div>
  );
}

export default ARViewer;