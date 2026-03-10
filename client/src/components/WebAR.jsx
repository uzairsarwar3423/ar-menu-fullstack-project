import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function WebAR({ item, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousTouchRef = useRef({ x: 0, y: 0 });

  // Handle touch/mouse interaction for model rotation
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    previousTouchRef.current = { x: clientX, y: clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !modelRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - previousTouchRef.current.x;
    const deltaY = clientY - previousTouchRef.current.y;

    // Rotate model based on drag direction
    modelRef.current.rotation.y += deltaX * 0.01;
    modelRef.current.rotation.x += deltaY * 0.01;

    previousTouchRef.current = { x: clientX, y: clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    initAR();
    return () => cleanup();
  }, []);

  const initAR = async () => {
    try {
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Back camera
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Setup Three.js
      setupThreeJS();
      setIsLoading(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera access.');
      setIsLoading(false);
    }
  };

  const setupThreeJS = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Load 3D Model
    const loader = new GLTFLoader();
    const modelUrl = item.modelUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, -1, -3);
        scene.add(model);
        modelRef.current = model;

        // Animate
        animate();
      },
      undefined,
      (error) => {
        console.error('Model loading error:', error);
      }
    );
  };

  const animate = () => {
    requestAnimationFrame(animate);

    if (modelRef.current) {
      // Rotate model slowly
      modelRef.current.rotation.y += 0.01;
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const cleanup = () => {
    // Stop camera
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    // Cleanup Three.js
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-2xl font-bold mb-4">Camera Access Required</h3>
          <p className="mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-primary px-6 py-3 rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Video Background (Camera Feed) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Three.js Canvas (3D Model) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{ touchAction: 'none' }}
      />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
            <p>Loading AR...</p>
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between text-white">
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition"
          >
            ✕ Exit AR
          </button>

          <div className="text-center">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm opacity-75">PKR {item.price}</p>
          </div>

          <div className="w-20"></div>
        </div>
      </div>

      {/* Bottom Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl">
          <div className="text-center">
            <p className="text-gray-800 font-semibold mb-2">
              👆 Point camera at a flat surface
            </p>
            <p className="text-sm text-gray-600">
              The 3D model will appear on your table
            </p>
          </div>
        </div>
      </div>

      {/* Center Target */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-32 h-32 border-4 border-white/50 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export default WebAR;