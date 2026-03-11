import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// Check WebXR support with feature detection
const checkXRSupport = async () => {
  if (!navigator.xr) {
    return { 
      supported: false, 
      supportedFeatures: { hitTest: false, localFloor: false, domOverlay: false },
      reason: 'WebXR not available in this browser' 
    };
  }
  try {
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!supported) {
      return { 
        supported: false, 
        supportedFeatures: { hitTest: false, localFloor: false, domOverlay: false },
        reason: 'AR is not supported on this device/browser' 
      };
    }

    // Check which features are supported
    const features = { hitTest: false, localFloor: false, domOverlay: false };
    
    // Try to check feature support (this is a best-effort check)
    // We'll try to request with optional features and see what works
    return { 
      supported: true, 
      supportedFeatures: features,
      reason: null 
    };
  } catch (e) {
    return { 
      supported: false, 
      supportedFeatures: { hitTest: false, localFloor: false, domOverlay: false },
      reason: e.message 
    };
  }
};

function WebXRAR({ item, onClose, onFallback }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('checking'); // checking, initializing, searching, ready, error
  const [error, setError] = useState(null);
  const [modelPlaced, setModelPlaced] = useState(false);
  const [useHitTest, setUseHitTest] = useState(true);
  
  const xrSessionRef = useRef(null);
  const xrRefSpaceRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const reticleRef = useRef(null);
  const animationRef = useRef(null);

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (xrSessionRef.current) {
      xrSessionRef.current.end();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initXR = async () => {
      try {
        // Check XR support
        const { supported, reason } = await checkXRSupport();
        
        if (!supported) {
          if (mounted) {
            setError(reason || 'AR not supported on this device');
            setStatus('error');
            // Offer fallback if available
            if (onFallback) {
              setTimeout(() => onFallback(), 2000);
            }
          }
          return;
        }

        if (!mounted) return;

        setStatus('initializing');

        // Try to request AR session with flexible features
        let session = null;
        let hitTestSupported = false;
        
        // Try with all features first (hit-test as optional)
        try {
          session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hit-test', 'dom-overlay'],
          });
          hitTestSupported = true;
        } catch (e) {
          console.log('Full AR features not supported, trying simpler config...');
          
          // Try with just viewer space (most basic AR)
          try {
            session = await navigator.xr.requestSession('immersive-ar', {
              requiredFeatures: ['viewer-space'],
              optionalFeatures: ['dom-overlay'],
            });
            hitTestSupported = false;
          } catch (e2) {
            // Last resort - try any AR session
            try {
              session = await navigator.xr.requestSession('immersive-ar');
              hitTestSupported = false;
            } catch (e3) {
              console.error('All AR session configurations failed:', e3);
              if (mounted) {
                setError('AR session could not be started. Your device may not fully support AR.');
                setStatus('error');
                if (onFallback) {
                  setTimeout(() => onFallback(), 2000);
                }
              }
              return;
            }
          }
        }

        if (!mounted) {
          if (session) session.end();
          return;
        }

        setUseHitTest(hitTestSupported);

        xrSessionRef.current = session;

        // Handle session end
        session.addEventListener('end', () => {
          xrSessionRef.current = null;
          if (mounted) {
            setStatus('error');
          }
        });

        // Set up renderer
        const canvas = document.createElement('canvas');
        canvas.id = 'xr-canvas';
        containerRef.current.appendChild(canvas);

        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        rendererRef.current = renderer;

        // Set up scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Lighting
        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        light.position.set(0, 20, 0);
        scene.add(light);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 0);
        scene.add(directionalLight);

        // Create reticle for surface detection
        const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 32);
        ringGeometry.rotateX(-Math.PI / 2);
        const reticleMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xFF6B6B, 
          transparent: true, 
          opacity: 0.8 
        });
        const reticle = new THREE.Mesh(ringGeometry, reticleMaterial);
        reticle.visible = false;
        reticle.matrixAutoUpdate = false;
        scene.add(reticle);
        reticleRef.current = reticle;

        // Get reference space - try local-floor first, fall back to viewer
        let refSpace;
        try {
          refSpace = await session.requestReferenceSpace('local-floor');
        } catch (e) {
          console.log('local-floor not supported, using viewer');
          refSpace = await session.requestReferenceSpace('viewer');
        }
        xrRefSpaceRef.current = refSpace;

        // Set up hit test source only if supported
        if (hitTestSupported) {
          try {
            const hitTestSource = await session.requestHitTestSource({ space: refSpace });
            hitTestSourceRef.current = hitTestSource;
          } catch (e) {
            console.log('Hit test not supported, AR will work without surface detection');
            hitTestSupported = false;
          }
        }

        // Load 3D model
        const modelUrl = item.modelUrl || '/models/burger.glb';
        
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        try {
          const gltf = await new Promise((resolve, reject) => {
            loader.load(
              modelUrl,
              resolve,
              (progress) => console.log('Loading:', (progress.loaded / progress.total * 100).toFixed(0) + '%'),
              reject
            );
          });

          if (!mounted) return;

          const model = gltf.scene;
          
          // Set realistic scale (in meters)
          model.scale.set(0.15, 0.15, 0.15);
          
          if (hitTestSupported) {
            // Hide until placed when surface detection is available
            model.visible = false;
            setStatus('searching');
          } else {
            // Show model directly when no surface detection
            model.visible = true;
            model.position.set(0, -0.5, -1); // Position in front of camera
            setStatus('ready');
            setModelPlaced(true);
          }
          
          scene.add(model);
          modelRef.current = model;

          // Start render loop
          if (!hitTestSupported) setStatus('ready');
          
          const onXRFrame = (time, frame) => {
            if (!mounted || !xrSessionRef.current) return;

            const session = xrSessionRef.current;
            const pose = frame.getViewerPose(xrRefSpaceRef.current);

            if (pose) {
              // Hit testing for surface detection
              if (hitTestSourceRef.current && !modelPlaced) {
                const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
                
                if (hitTestResults.length > 0) {
                  const hit = hitTestResults[0];
                  const pose = hit.getPose(xrRefSpaceRef.current);
                  
                  if (pose) {
                    reticle.visible = true;
                    reticle.matrix.fromArray(pose.transform.matrix);
                  }
                } else {
                  reticle.visible = false;
                }
              }

              // Render
              if (rendererRef.current && sceneRef.current) {
                for (const view of pose.views) {
                  rendererRef.current.render(sceneRef.current, view);
                }
              }
            }

            animationRef.current = session.requestAnimationFrame(onXRFrame);
          };

          session.requestAnimationFrame(onXRFrame);

        } catch (modelError) {
          console.error('Model loading error:', modelError);
          if (mounted) {
            setError('Failed to load 3D model');
            setStatus('error');
          }
        }

      } catch (err) {
        console.error('XR init error:', err);
        if (mounted) {
          setError(err.message || 'Failed to start AR');
          setStatus('error');
        }
      }
    };

    initXR();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [item.modelUrl, modelPlaced, cleanup]);

  // Handle tap to place model
  const handleTap = useCallback(() => {
    if (modelPlaced || !reticleRef.current || !modelRef.current) return;
    
    if (reticleRef.current.visible) {
      // Place model at reticle position
      modelRef.current.position.setFromMatrixPosition(reticleRef.current.matrix);
      modelRef.current.position.y += 0.075; // Offset for model height
      modelRef.current.visible = true;
      setModelPlaced(true);
      setStatus('ready');
    }
  }, [modelPlaced]);

  // Handle exit
  const handleExit = () => {
    cleanup();
    if (onClose) {
      onClose();
    } else {
      navigate('/menu');
    }
  };

  const handleFallbackClick = () => {
    cleanup();
    if (onFallback) {
      onFallback();
    }
  };

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">AR Not Available</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          {onFallback && (
            <button
              onClick={handleFallbackClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold mb-3 w-full"
            >
              Try Camera AR Instead
            </button>
          )}
          <button
            onClick={handleExit}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold w-full"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
      onClick={handleTap}
    >
      {/* Status overlays */}
      {status === 'checking' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p>Checking AR support...</p>
          </div>
        </div>
      )}

      {status === 'initializing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p>Starting AR...</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {status === 'searching' && !modelPlaced && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-xl text-white text-center">
            <p className="font-semibold">📍 Move your phone to detect surfaces</p>
            <p className="text-sm text-gray-300 mt-1">Tap when the circle appears to place the model</p>
          </div>
        </div>
      )}

      {status === 'ready' && modelPlaced && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-xl text-white text-center">
            <p className="font-semibold">✅ Model placed!</p>
            <p className="text-sm text-gray-300 mt-1">Move around to view from different angles</p>
          </div>
        </div>
      )}

      {/* Exit button */}
      <button
        onClick={handleExit}
        className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 text-white w-12 h-12 rounded-full font-bold text-xl z-10 flex items-center justify-center"
      >
        ✕
      </button>

      {/* Item info */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg z-10">
        <h3 className="text-white font-bold">{item.name}</h3>
        <p className="text-gray-300 text-sm">PKR {item.price}</p>
      </div>
    </div>
  );
}

export default WebXRAR;
