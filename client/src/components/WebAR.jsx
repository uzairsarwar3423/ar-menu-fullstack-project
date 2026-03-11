import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const WebAR = memo(function WebAR({ item, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHint, setShowHint] = useState(true);
  
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousTouchRef = useRef({ x: 0, y: 0 });
  const autoRotateSpeed = 0.005; // Auto rotate speed
  const manualRotateSpeed = 0.01;
  const moveSpeed = 0.003;
  const zoomSpeed = 0.001;
  const minScale = 0.3;
  const maxScale = 4;

  // Hide hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
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

    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          child.material?.dispose();
        }
      });
    }
  }, []);

  // ===== TOUCH CONTROLS =====
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      // Single finger = rotate
      isDraggingRef.current = true;
      previousTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if (e.touches.length === 2) {
      // Two fingers = move
      isDraggingRef.current = true;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      previousTouchRef.current = { x: midX, y: midY };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!modelRef.current) return;

    // Prevent page scroll
    e.preventDefault();

    if (e.touches.length === 1 && isDraggingRef.current) {
      // Single finger = rotate
      const deltaX = e.touches[0].clientX - previousTouchRef.current.x;
      const deltaY = e.touches[0].clientY - previousTouchRef.current.y;

      modelRef.current.rotation.y += deltaX * manualRotateSpeed;
      modelRef.current.rotation.x += deltaY * manualRotateSpeed;

      previousTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if (e.touches.length === 2 && isDraggingRef.current) {
      // Two fingers = move
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const deltaX = midX - previousTouchRef.current.x;
      const deltaY = midY - previousTouchRef.current.y;

      modelRef.current.position.x += deltaX * moveSpeed;
      modelRef.current.position.y -= deltaY * moveSpeed;

      previousTouchRef.current = { x: midX, y: midY };
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // ===== MOUSE CONTROLS =====
  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    
    // Double click to exit
    if (e.detail === 2) {
      onClose();
      return;
    }
    
    isDraggingRef.current = true;
    previousTouchRef.current = { x: e.clientX, y: e.clientY };
  }, [onClose]);

  const handlePointerMove = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    if (!isDraggingRef.current || !modelRef.current) return;

    const deltaX = e.clientX - previousTouchRef.current.x;
    const deltaY = e.clientY - previousTouchRef.current.y;

    // Left click = rotate
    if (e.buttons === 1) {
      modelRef.current.rotation.y += deltaX * manualRotateSpeed;
      modelRef.current.rotation.x += deltaY * manualRotateSpeed;
    }
    // Right click = move
    else if (e.buttons === 2) {
      modelRef.current.position.x += deltaX * moveSpeed;
      modelRef.current.position.y -= deltaY * moveSpeed;
    }

    previousTouchRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  // ===== ZOOM WITH MOUSE WHEEL =====
  const handleWheel = useCallback((e) => {
    if (!modelRef.current) return;
    e.preventDefault();
    
    const delta = e.deltaY * -zoomSpeed;
    const currentScale = modelRef.current.scale.x;
    const newScale = Math.max(minScale, Math.min(maxScale, currentScale + delta));
    modelRef.current.scale.set(newScale, newScale, newScale);
  }, []);

  // ===== PINCH ZOOM FOR TOUCH =====
  const initialPinchDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);

  const handleTouchStartPinch = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      initialScaleRef.current = modelRef.current?.scale.x || 1;
    }
  }, []);

  const handleTouchMovePinch = useCallback((e) => {
    if (e.touches.length === 2 && modelRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (initialPinchDistanceRef.current > 0) {
        const scale = distance / initialPinchDistanceRef.current;
        const newScale = Math.max(minScale, Math.min(maxScale, initialScaleRef.current * scale));
        modelRef.current.scale.set(newScale, newScale, newScale);
      }
    }
  }, []);

  // Combined touch handlers
  const handleTouchStartCombined = useCallback((e) => {
    handleTouchStart(e);
    handleTouchStartPinch(e);
  }, [handleTouchStart, handleTouchStartPinch]);

  const handleTouchMoveCombined = useCallback((e) => {
    handleTouchMove(e);
    handleTouchMovePinch(e);
  }, [handleTouchMove, handleTouchMovePinch]);

  useEffect(() => {
    let mounted = true;

    const initAR = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setupThreeJS();
        setIsLoading(false);
      } catch (err) {
        console.error('Camera error:', err);
        if (mounted) {
          setError('Camera access denied');
          setIsLoading(false);
        }
      }
    };

    const setupThreeJS = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const isMobileScreen = window.innerWidth < 768;
      const baseScale = isMobileScreen ? 0.6 : 1.5;
      const cameraZ = isMobileScreen ? 3 : 2;
      const modelZ = isMobileScreen ? -1.5 : -2;
      const modelY = isMobileScreen ? 0 : -0.5;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(
        75,
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
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight1.position.set(5, 5, 5);
      directionalLight1.castShadow = true;
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight2.position.set(-5, 3, -5);
      scene.add(directionalLight2);

      const fillLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
      scene.add(fillLight);

      // Ground plane for shadows
      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1;
      ground.receiveShadow = true;
      scene.add(ground);

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
          
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          model.scale.set(baseScale, baseScale, baseScale);
          model.position.set(0, modelY, modelZ);
          scene.add(model);
          modelRef.current = model;

          animate();
        },
        (progress) => {
          console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
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
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

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
            if (mounted) {
              setError('Failed to load 3D model');
            }
          }
        );
      };

      const handleResize = () => {
        if (!camera || !renderer) return;
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    const animate = () => {
      if (!mounted) return;
      
      animationFrameRef.current = requestAnimationFrame(animate);

      // Auto-rotate when not being dragged
      if (modelRef.current && !isDraggingRef.current) {
        modelRef.current.rotation.y += autoRotateSpeed;
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
        <div className="text-center text-white">
          <p className="mb-4 text-lg">{error}</p>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg font-semibold transition"
          >
            ✕ Exit
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
        onTouchStart={handleTouchStartCombined}
        onTouchMove={handleTouchMoveCombined}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{ touchAction: 'none' }}
      />

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Control Hints */}
      {showHint && !isLoading && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm px-5 py-3 rounded-xl flex flex-wrap justify-center gap-3 text-white text-sm">
            <span>🖱️ <b>Left drag</b> = Rotate</span>
            <span className="text-white/50">|</span>
            <span>🖱️ <b>Right drag</b> = Move</span>
            <span className="text-white/50">|</span>
            <span>🖱️ <b>Scroll</b> = Zoom</span>
            <span className="text-white/50">|</span>
            <span>👆 <b>1 finger</b> = Rotate</span>
            <span className="text-white/50">|</span>
            <span>✌️ <b>2 fingers</b> = Move</span>
            <span className="text-white/50">|</span>
            <span>🤏 <b>Pinch</b> = Zoom</span>
          </div>
        </div>
      )}

      {/* Exit Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 text-white w-10 h-10 rounded-full font-bold text-lg shadow-lg transition flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
});

export default WebAR;

