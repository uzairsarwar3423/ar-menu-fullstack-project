import React, { Suspense, memo, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';

// Memoized Model Component with Draco support
const Model = memo(function Model({ url }) {
  const { scene } = useGLTF(url);
  
  return (
    <primitive 
      object={scene.clone()} 
      scale={3}
      position={[0, -0.5, 0]}
    />
  );
});

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

// Preload 3D models
useGLTF.preload('/models/burger.glb');
useGLTF.preload('/models/pizza.glb');
useGLTF.preload('/models/fries.glb');

// Main AR Viewer Component
const ARViewer = memo(function ARViewer({ modelUrl, itemName }) {
  const canvasRef = useRef(null);

  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden shadow-lg">
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)' }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          // Handle WebGL context loss
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.warn('WebGL context lost in ARViewer');
          });
          
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored in ARViewer');
          });
        }}
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
          enableDamping={true}
          dampingFactor={0.05}
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
});

export default ARViewer;
