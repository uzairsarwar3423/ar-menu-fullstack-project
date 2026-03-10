import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const WebAR = memo(function WebAR({ item, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousTouchRef = useRef({ x: 0, y: 0 });

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  }, []);

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

      // Responsive values based on screen size
      const isMobileScreen = window.innerWidth < 768;
      const modelScale = isMobileScreen ? 0.6 : 1.5;
      const cameraZ = isMobileScreen ? 3 : 2;
      const modelZ = isMobileScreen ? -1.5 : -2;
      const modelY = isMobileScreen ? 0 : -0.5;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.01,
        1000
      );
      camera.position.set(0, 0, 0);
      camera.lookAt(0, 0, -cameraZ);
      cameraRef.current = camera;

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

      renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.warn('WebGL context lost');
      });

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(2, 4, 2);
      scene.add(directionalLight);

      const fillLight = new THREE.DirectionalLight(0x88ccff, 0.3);
      fillLight.position.set(-2, 2, -1);
      scene.add(fillLight);

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      
      const modelUrl = item.modelUrl || 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

      loader.load(
        modelUrl,
        (gltf) => {
          if (!mounted) return;
          
          const model = gltf.scene;
          model.scale.set(modelScale, modelScale, modelScale);
          model.position.set(0, modelY, modelZ);
          scene.add(model);
          modelRef.current = model;

          animate();
        },
        undefined,
        (error) => {
          console.error('Model loading error:', error);
          tryNonCompressedModel();
        }
      );

      const tryNonCompressedModel = () => {
        const fallbackLoader = new GLTFLoader();
        fallbackLoader.load(
          modelUrl,
          (gltf) => {
            if (!mounted) return;
            
            const model = gltf.scene;
            // Use slightly larger scale for fallback
            const fallbackScale = isMobileScreen ? 0.7 : 1.8;
            model.scale.set(fallbackScale, fallbackScale, fallbackScale);
            model.position.set(0, modelY, modelZ);
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
      {/* Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Three.js Canvas */}
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
            ✕ Exit
          </button>

          <div className="text-center">
            <p className="font-bold text-lg">{item.name}</p>
            <p className="text-sm opacity-75">PKR {item.price}</p>
          </div>

          <div className="w-16"></div>
        </div>
      </div>

    

      {/* Center Target Reticle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-32 h-32 border-4 border-white/50 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
});

export default WebAR;
