import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Memoized WebAR component for performance
const WebAR = memo(function WebAR({ item, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousTouchRef = useRef({ x: 0, y: 0 });

  // Cleanup function
  const cleanup = useCallback(() => {
    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Stop camera
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    // Cleanup Three.js
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  }, []);

  // Pointer handlers for model rotation
  const handlePointerDown = useCallback((e) => {
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    previousTouchRef.current = { x: clientX, y: clientY };
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current || !modelRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - previousTouchRef.current.x;
    const deltaY = clientY - previousTouchRef.current.y;

    // Rotate model based on drag direction
    modelRef.current.rotation.y += deltaX * 0.01;
    modelRef.current.rotation.x += deltaY * 0.01;

    previousTouchRef.current = { x: clientX, y: clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAR = async () => {
      try {
        // Get camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // Setup Three.js
        setupThreeJS();
        setIsLoading(false);
      } catch (err) {
        console.error('Camera error:', err);
        if (mounted) {
          setError('Camera access denied. Please allow camera access.');
          setIsLoading(false);
        }
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

      // Optimized Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      // Handle context loss
      renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.warn('WebGL context lost');
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      });

      renderer.domElement.addEventListener('webglcontextrestored', () => {
        console.log('WebGL context restored');
        if (modelRef.current && sceneRef.current && cameraRef.current) {
          animate();
        }
      });

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // Setup DRACO loader for compressed GLTF models
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

      // Load 3D Model
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      
      const modelUrl = item.modelUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

      loader.load(
        modelUrl,
        (gltf) => {
          if (!mounted) return;
          
          const model = gltf.scene;
          model.scale.set(2.0, 2.0, 2.0);
          model.position.set(0, -1, -1.5);
          scene.add(model);
          modelRef.current = model;

          // Start animation loop
          animate();
        },
        undefined,
        (error) => {
          console.error('Model loading error:', error);
          // Try loading without Draco if it fails
          tryNonCompressedModel();
        }
      );

      // Fallback: Try loading without Draco compression
      const tryNonCompressedModel = () => {
        const fallbackLoader = new GLTFLoader();
        fallbackLoader.load(
          modelUrl,
          (gltf) => {
            if (!mounted) return;
            
            const model = gltf.scene;
            model.scale.set(2.0, 2.0, 2.0);
            model.position.set(0, -1, -1.5);
            scene.add(model);
            modelRef.current = model;
            animate();
          },
          undefined,
          (err) => {
            console.error('Fallback model loading also failed:', err);
          }
        );
      };
    };

    const animate = () => {
      if (!mounted) return;
      
      animationFrameRef.current = requestAnimationFrame(animate);

      if (modelRef.current && !isDraggingRef.current) {
        // Auto-rotate when not dragging
        modelRef.current.rotation.y += 0.005;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    initAR();
    
    return () => {
      mounted = false;
      cleanup();
    };
  }, [item.modelUrl, cleanup]);

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
        autoPlay
      />

      {/* Three.js Canvas (3D Model) - Interactive */}
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
              👆 Drag to rotate model • Point at flat surface
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
});

export default WebAR;
