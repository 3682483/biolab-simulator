import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createProceduralMechanical } from './ProceduralModels';
import { ModelAnnotation, ModelStats } from '../types/annotation';
import { soundFX } from '../utils/audio';
import { captureCompositedScreenshot } from '../utils/screenshotExporter';

// Pre-allocated math variables for zero GC
const _vec3 = new THREE.Vector3();
const _screenVec = new THREE.Vector3();
const _anchorVec = new THREE.Vector3();
const _screenAnchorVec = new THREE.Vector3();
const _labelDir = new THREE.Vector3();
const _pAnchorVec = new THREE.Vector3();

// 模型导入进度：reading = 读文件（有真实百分比），parsing = 本地解析（不定进度）
export interface ModelLoadProgress {
  phase: 'reading' | 'parsing';
  percent: number;
  fileName: string;
  fileSizeMB: string;
}

interface CellViewerProps {
  modelSource: 'none' | 'custom' | 'demo-mech';
  showAnnotations: boolean;
  showGrid?: boolean;
  annotations: ModelAnnotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  isAddMode: boolean;
  onSurfaceClick: (anchorPoint: [number, number, number], normal: [number, number, number]) => void;
  customFile: File | null;
  demoTrigger: number;
  onModelLoaded: (stats: ModelStats) => void;
  onLoadProgress?: (progress: ModelLoadProgress | null) => void;
  cameraPresetCommand: string | null;
  onPreviousViewChange?: (hasPrev: boolean) => void;
  onManualOrbit?: () => void;
  onRegisterGetModelGroup?: (fn: () => THREE.Group | null) => void;
  onRegisterTakeScreenshot?: (fn: () => void) => void;
}

export const CellViewer: React.FC<CellViewerProps> = ({
  modelSource,
  showAnnotations,
  showGrid = true,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  isAddMode,
  onSurfaceClick,
  customFile,
  demoTrigger,
  onModelLoaded,
  onLoadProgress,
  cameraPresetCommand,
  onPreviousViewChange,
  onManualOrbit,
  onRegisterGetModelGroup,
  onRegisterTakeScreenshot,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelGroupRef = useRef<THREE.Group | null>(null);
  const annotationLinesGroupRef = useRef<THREE.Group | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);

  // Raycasting
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Direct DOM Element refs for 3D label cards
  const labelElementsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  // Mutable refs
  const annotationsRef = useRef<ModelAnnotation[]>(annotations);
  annotationsRef.current = annotations;

  const showAnnotationsRef = useRef<boolean>(showAnnotations);
  showAnnotationsRef.current = showAnnotations;

  const modelSourceRef = useRef<string>(modelSource);
  modelSourceRef.current = modelSource;

  const onModelLoadedRef = useRef(onModelLoaded);
  onModelLoadedRef.current = onModelLoaded;

  const onLoadProgressRef = useRef(onLoadProgress);
  onLoadProgressRef.current = onLoadProgress;

  // 标签引线外推基准：模型中心 + 最小引线长度（随模型尺寸自适应，加载时更新）
  const modelCenterRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const minLabelDistRef = useRef(0.3);

  const onSurfaceClickRef = useRef(onSurfaceClick);
  onSurfaceClickRef.current = onSurfaceClick;

  const onSelectAnnotationRef = useRef(onSelectAnnotation);
  onSelectAnnotationRef.current = onSelectAnnotation;

  // On-demand rendering coordinator
  const renderRequestedRef = useRef<boolean>(false);
  const isTransitioningCameraRef = useRef<boolean>(false);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(3.2, 2.4, 4.2));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const animFrameIdRef = useRef<number>(0);
  const previousCameraStateRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  const onPreviousViewChangeRef = useRef(onPreviousViewChange);
  onPreviousViewChangeRef.current = onPreviousViewChange;

  const onManualOrbitRef = useRef(onManualOrbit);
  onManualOrbitRef.current = onManualOrbit;

  // 标签引线外推：labelPoint 离锚点太近时沿原方向推出最小距离，避免标签全挤在模型中间
  const computeEffectiveLabelPoint = useCallback(
    (anno: ModelAnnotation, scale: number, out: THREE.Vector3): THREE.Vector3 => {
      out.set(anno.labelPoint[0] * scale, anno.labelPoint[1] * scale, anno.labelPoint[2] * scale);
      _pAnchorVec.set(anno.anchorPoint[0] * scale, anno.anchorPoint[1] * scale, anno.anchorPoint[2] * scale);
      _labelDir.subVectors(out, _pAnchorVec);
      if (_labelDir.lengthSq() < 1e-9) {
        // 退化：labelPoint 与锚点重合，改用“模型中心 → 锚点”的向外方向
        _labelDir.subVectors(_pAnchorVec, modelCenterRef.current);
      }
      if (_labelDir.lengthSq() < 1e-9) {
        _labelDir.set(0, 1, 0);
      }
      _labelDir.normalize();

      const minDist = minLabelDistRef.current;
      if (out.distanceTo(_pAnchorVec) < minDist) {
        out.copy(_pAnchorVec).addScaledVector(_labelDir, minDist);
      }
      return out;
    },
    []
  );

  // Update label DOM positions
  const updateLabelsDOM = useCallback(() => {
    if (!cameraRef.current || !mountRef.current) return;
    const cam = cameraRef.current;
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;
    const modelGroup = currentModelGroupRef.current;
    const scale = modelGroup ? modelGroup.scale.x : 1;
    const shouldShow = showAnnotationsRef.current && modelSourceRef.current !== 'none' && !!modelGroup;

    labelElementsMap.current.forEach((el, annoId) => {
      if (!shouldShow) {
        el.style.display = 'none';
        return;
      }

      const anno = annotationsRef.current.find((a) => a.id === annoId);
      if (!anno || anno.visible === false) {
        el.style.display = 'none';
        return;
      }

      computeEffectiveLabelPoint(anno, scale, _vec3);

      _screenVec.copy(_vec3).project(cam);

      const isBehind = _screenVec.z > 1;
      const screenX = (_screenVec.x * 0.5 + 0.5) * w;
      const screenY = (-(_screenVec.y * 0.5) + 0.5) * h;

      if (isBehind || screenX < -150 || screenX > w + 150 || screenY < -150 || screenY > h + 150) {
        el.style.display = 'none';
      } else {
        _anchorVec.set(
          anno.anchorPoint[0] * scale,
          anno.anchorPoint[1] * scale,
          anno.anchorPoint[2] * scale
        );
        _screenAnchorVec.copy(_anchorVec).project(cam);
        const anchorScreenX = (_screenAnchorVec.x * 0.5 + 0.5) * w;
        const isRight = screenX >= anchorScreenX;

        el.style.display = 'block';
        if (isRight) {
          el.style.transform = `translate3d(${Math.round(screenX)}px, ${Math.round(screenY)}px, 0) translate(0%, -50%)`;
        } else {
          el.style.transform = `translate3d(${Math.round(screenX)}px, ${Math.round(screenY)}px, 0) translate(-100%, -50%)`;
        }

        const inner = el.firstElementChild as HTMLElement | null;
        if (inner) {
          if (isRight) {
            inner.style.borderLeftColor = anno.color;
            inner.style.borderLeftWidth = '3.5px';
            inner.style.borderRightColor = 'rgba(51, 65, 85, 0.8)';
            inner.style.borderRightWidth = '1px';
          } else {
            inner.style.borderRightColor = anno.color;
            inner.style.borderRightWidth = '3.5px';
            inner.style.borderLeftColor = 'rgba(51, 65, 85, 0.8)';
            inner.style.borderLeftWidth = '1px';
          }
        }

        const dist = cam.position.distanceTo(_vec3);
        el.style.opacity = String(Math.min(1, Math.max(0.4, 1 - dist / 12)));
      }
    });
  }, [computeEffectiveLabelPoint]);

  // On-demand render request
  const requestRender = useCallback(() => {
    if (renderRequestedRef.current) return;
    renderRequestedRef.current = true;

    requestAnimationFrame(() => {
      renderRequestedRef.current = false;
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;

      controlsRef.current.update();
      updateLabelsDOM();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    });
  }, [updateLabelsDOM]);

  // Smooth camera animation loop that runs ONLY when transitioning, then completely sleeps!
  const animateCameraToTarget = useCallback((newPos: THREE.Vector3, newLookAt: THREE.Vector3) => {
    targetCamPos.current.copy(newPos);
    targetLookAt.current.copy(newLookAt);

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = 0;
    }
    isTransitioningCameraRef.current = true;

    const step = () => {
      if (!cameraRef.current || !controlsRef.current || !rendererRef.current || !sceneRef.current) {
        isTransitioningCameraRef.current = false;
        animFrameIdRef.current = 0;
        return;
      }

      const cam = cameraRef.current;
      const ctrl = controlsRef.current;

      cam.position.lerp(targetCamPos.current, 0.12);
      ctrl.target.lerp(targetLookAt.current, 0.12);
      ctrl.update();

      updateLabelsDOM();
      rendererRef.current.render(sceneRef.current, cam);

      const posDist = cam.position.distanceTo(targetCamPos.current);
      const lookDist = ctrl.target.distanceTo(targetLookAt.current);

      if (posDist > 0.015 || lookDist > 0.015) {
        animFrameIdRef.current = requestAnimationFrame(step);
      } else {
        // Snap to exact target and sleep!
        cam.position.copy(targetCamPos.current);
        ctrl.target.copy(targetLookAt.current);
        ctrl.update();
        updateLabelsDOM();
        rendererRef.current.render(sceneRef.current, cam);
        isTransitioningCameraRef.current = false;
        animFrameIdRef.current = 0;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(step);
  }, [updateLabelsDOM]);

  // Register getModelGroup for GLB exporter once on mount
  const onRegisterGetModelGroupRef = useRef(onRegisterGetModelGroup);
  onRegisterGetModelGroupRef.current = onRegisterGetModelGroup;
  useEffect(() => {
    if (onRegisterGetModelGroupRef.current) {
      onRegisterGetModelGroupRef.current(() => currentModelGroupRef.current);
    }
  }, []);

  // Register screenshot handler for full composited screenshot (WebGL + HTML labels & text boxes)
  const onRegisterTakeScreenshotRef = useRef(onRegisterTakeScreenshot);
  onRegisterTakeScreenshotRef.current = onRegisterTakeScreenshot;

  const handleTakeScreenshotAction = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !mountRef.current) return;

    // 1. Force a fresh render to ensure WebGL buffer has current frame
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    updateLabelsDOM();

    // 2. Capture composited canvas including 3D model, lines, surface dots, and all label boxes & text
    const canvas = rendererRef.current.domElement;
    const baseName = modelSourceRef.current === 'custom' ? '3d-model' : 'AeroTurbine';

    captureCompositedScreenshot({
      canvas,
      mountElement: mountRef.current,
      annotations: annotationsRef.current,
      showAnnotations: showAnnotationsRef.current,
      selectedAnnotationId: selectedAnnotationId,
      fileName: `${baseName}-inspection-with-labels-${Date.now()}.png`,
    });
  }, [updateLabelsDOM, selectedAnnotationId]);

  useEffect(() => {
    if (onRegisterTakeScreenshotRef.current) {
      onRegisterTakeScreenshotRef.current(handleTakeScreenshotAction);
    }
  }, [handleTakeScreenshotAction]);

  // 1. Initial Scene Setup (Lightweight, No shadows, No heavy PMREM, On-demand rendering)
  useEffect(() => {
    if (!mountRef.current) return;

    // SPA 导航 / StrictMode 双挂载时 cleanup 可能删不净旧画布（卸载瞬间 ref 已置 null）——
    // 残留画布会把新画布顶出视口，出现"首次进入黑屏、刷新才正常"。先清场再挂。
    mountRef.current.querySelectorAll('canvas').forEach((c) => c.remove());

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060814);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.copy(targetCamPos.current);
    cameraRef.current = camera;

    // Fast, lightweight WebGLRenderer (Zero heavy shadow maps)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'default',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap pixel ratio to 1.5 for ultra-fast rendering
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = false; // Disable heavy shadow passes!

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Clean 2-point studio lighting (Fast, no shadow depth maps)
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e1b4b, 0.9);
    scene.add(hemiLight);

    // 环境光补底：消除背光面死黑，让暗部细节可见
    const ambientLight = new THREE.AmbientLight(0xbfd4ff, 0.55);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    dirLight.position.set(4, 6, 5);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x818cf8, 1.2);
    backLight.position.set(-4, 3, -4);
    scene.add(backLight);

    // Minimal lightweight grid floor (controllable via showGrid)
    const grid = new THREE.GridHelper(5, 20, 0x1e293b, 0x0f172a);
    grid.position.y = -0.5;
    grid.visible = showGrid;
    scene.add(grid);
    gridRef.current = grid;

    // Dedicated Group for 3D Straight Pointer Lines & Anchor Dots
    const linesGroup = new THREE.Group();
    linesGroup.name = 'Annotation3DLinesGroup';
    scene.add(linesGroup);
    annotationLinesGroupRef.current = linesGroup;

    // OrbitControls with On-Demand rendering listener
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.8;
    controls.maxDistance = 14;
    controlsRef.current = controls;

    // Immediately interrupt programmatic camera animation when user begins manual mouse drag/rotation!
    controls.addEventListener('start', () => {
      if (isTransitioningCameraRef.current) {
        isTransitioningCameraRef.current = false;
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = 0;
        }
      }
      if (onManualOrbitRef.current) {
        onManualOrbitRef.current();
      }
    });

    // Smooth inertia glide loop when user releases mouse
    let isDampingLoopRunning = false;
    const runDampingLoop = () => {
      if (!controlsRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        isDampingLoopRunning = false;
        return;
      }
      const moved = controlsRef.current.update();
      updateLabelsDOM();
      rendererRef.current.render(sceneRef.current, cameraRef.current);

      if (moved) {
        requestAnimationFrame(runDampingLoop);
      } else {
        isDampingLoopRunning = false;
      }
    };

    // RENDER ONLY WHEN USER INTERACTS! (Zero CPU/GPU idle usage)
    controls.addEventListener('change', () => {
      if (!isTransitioningCameraRef.current && !isDampingLoopRunning) {
        isDampingLoopRunning = true;
        requestAnimationFrame(runDampingLoop);
      }
    });

    // Initial render
    requestRender();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      requestRender();
    };

    window.addEventListener('resize', handleResize);

    // 页面闲置久/休眠恢复/系统内存压力时浏览器可能回收 WebGL 上下文——
    // 不 preventDefault 的话 canvas 永久死掉，点载入模型也画不出来，只能刷新页面
    const handleContextLost = (e: Event) => {
      e.preventDefault(); // 允许浏览器自动 restore
      console.warn('[CellViewer] WebGL 上下文丢失，等待恢复…');
    };
    const handleContextRestored = () => {
      // restore 后 GL 资源（几何/纹理/着色器）是懒重建的，首帧可能输出空画面——隔帧再补一帧
      rendererRef.current?.resetState?.();
      requestRender();
      requestAnimationFrame(() => requestRender());
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 从后台标签页/休眠切回时 canvas 合成层内容可能被丢弃，兜底重画一帧；
    // 同时复位挂起标志——页面隐藏期间 rAF 停摆可能让防重入标志卡在 true，不复位的话这次重画也会被吞
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        renderRequestedRef.current = false;
        requestRender();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      renderer.dispose();
      // 自移除：不依赖 mountRef（卸载瞬间 ref 可能已被 React 置 null，removeChild 会静默跳过导致画布残留）
      renderer.domElement.remove();
    };
  }, [requestRender]);

  // Helper to scale model to a comfortable fraction (~52%) of the smaller viewport dimension
  const fitModelToViewport = (model: THREE.Group | THREE.Object3D) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    model.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim <= 0) return;

    const dist = camera.position.distanceTo(controls.target);
    const vFovRad = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFovRad / 2) * dist;
    const visibleWidth = visibleHeight * camera.aspect;
    const minViewportDim = Math.min(visibleHeight, visibleWidth);

    const targetModelDim = minViewportDim * 0.52;
    const finalScale = targetModelDim / maxDim;

    model.scale.setScalar(finalScale);

    // Compute bounding box after scaling
    model.updateMatrixWorld(true);
    const scaledBox = new THREE.Box3().setFromObject(model);

    // 更新标签外推基准：模型中心 + 最小引线长度（约模型对角线 1/3，保证标签散在模型外围而非挤在中间）
    scaledBox.getCenter(modelCenterRef.current);
    const scaledSize = new THREE.Vector3();
    scaledBox.getSize(scaledSize);
    minLabelDistRef.current = scaledSize.length() * 0.32;

    // Reduce height off the grid to ~1/4 of previous gap:
    // Previously the grid was at -1.2 while model bottom was at ~ -0.6 (gap was ~ 0.55m - 0.6m).
    // Now keep the model close to the grid: height gap is reduced to 1/4 (~0.12m).
    if (gridRef.current) {
      gridRef.current.position.y = scaledBox.min.y - 0.12;
    }
  };

  // Toggle Grid visibility on-demand
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.visible = showGrid !== false;
      requestRender();
    }
  }, [showGrid, requestRender]);

  // 2. Custom GLB File Upload & Parsing（全程本地：FileReader 读内存 + GLTFLoader.parse，零网络请求）
  useEffect(() => {
    if (!customFile || !sceneRef.current) return;

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    // Draco 解码器走本地 public/draco，确保 Draco 压缩模型也不产生任何外部网络请求
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);

    const fileSizeMB = (customFile.size / (1024 * 1024)).toFixed(2);
    const reportProgress = onLoadProgressRef.current;

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (reportProgress && e.total > 0) {
        reportProgress({
          phase: 'reading',
          percent: Math.round((e.loaded / e.total) * 100),
          fileName: customFile.name,
          fileSizeMB,
        });
      }
    };
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        reportProgress?.(null);
        return;
      }

      // 解析是同步阻塞主线程的，先让进度条渲染出来再动手
      reportProgress?.({
        phase: 'parsing',
        percent: 100,
        fileName: customFile.name,
        fileSizeMB,
      });
      setTimeout(() => {
        loader.parse(
          buffer,
          '',
          (gltf) => {
            if (!sceneRef.current) return;

            if (currentModelGroupRef.current) {
              sceneRef.current.remove(currentModelGroupRef.current);
            }

            const model = gltf.scene;
            model.name = 'Custom_3D_Model';

            let meshCount = 0;
            let vertexCount = 0;
            let triangleCount = 0;
            const materials = new Set<string>();

            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                meshCount++;
                if (mesh.geometry) {
                  const posAttr = mesh.geometry.attributes['position'];
                  vertexCount += posAttr ? posAttr.count : 0;
                  if (mesh.geometry.index) {
                    triangleCount += mesh.geometry.index.count / 3;
                  }
                }
                if (mesh.material) {
                  materials.add(Array.isArray(mesh.material) ? 'multi' : mesh.material.name || 'mat');
                }
              }
            });

            // Scale model to a comfortable fraction of viewport
            fitModelToViewport(model);

            sceneRef.current.add(model);
            currentModelGroupRef.current = model;

            // Reset camera & render
            targetCamPos.current.set(3.2, 2.4, 4.2);
            targetLookAt.current.set(0, 0, 0);
            if (cameraRef.current && controlsRef.current) {
              cameraRef.current.position.copy(targetCamPos.current);
              controlsRef.current.target.copy(targetLookAt.current);
              controlsRef.current.update();
            }

            requestRender();

            if (onModelLoadedRef.current) {
              onModelLoadedRef.current({
                meshCount,
                vertexCount,
                triangleCount,
                materialCount: materials.size,
                fileName: customFile.name,
                fileSize: fileSizeMB + ' MB',
              });
            }
            reportProgress?.(null);
          },
          (err) => {
            console.error('Failed to parse GLB:', err);
            reportProgress?.(null);
          }
        );
      }, 0);
    };
    reader.onerror = () => reportProgress?.(null);

    reader.readAsArrayBuffer(customFile);
  }, [customFile, requestRender]);

  // 3. Demo Model Loader (Mechanical Aerospace Turbine)
  useEffect(() => {
    if (demoTrigger === 0 || !sceneRef.current) return;

    if (currentModelGroupRef.current) {
      sceneRef.current.remove(currentModelGroupRef.current);
    }

    const demoModel = createProceduralMechanical();
    fitModelToViewport(demoModel);

    sceneRef.current.add(demoModel);
    currentModelGroupRef.current = demoModel;

    targetCamPos.current.set(3.2, 2.4, 4.2);
    targetLookAt.current.set(0, 0, 0);
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.copy(targetCamPos.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
    }

    requestRender();

    if (onModelLoadedRef.current) {
      onModelLoadedRef.current({
        meshCount: 8,
        vertexCount: 1800,
        triangleCount: 1600,
        materialCount: 6,
        fileName: 'AeroTurbine_Demo.glb',
        fileSize: '0.8 MB',
      });
    }
  }, [demoTrigger, requestRender]);

  // 4. Handle Empty State
  useEffect(() => {
    if (modelSource === 'none' && sceneRef.current && currentModelGroupRef.current) {
      sceneRef.current.remove(currentModelGroupRef.current);
      currentModelGroupRef.current = null;
      targetCamPos.current.set(3.2, 2.4, 4.2);
      targetLookAt.current.set(0, 0, 0);
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.copy(targetCamPos.current);
        controlsRef.current.target.copy(targetLookAt.current);
        controlsRef.current.update();
      }
      requestRender();
    }
  }, [modelSource, requestRender]);

  // 5. Engineering Camera Presets (Manual trigger)
  useEffect(() => {
    if (!cameraPresetCommand || !controlsRef.current || !cameraRef.current) return;

    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    // Handle restoring to the exact user perspective prior to clicking a preset
    if (cameraPresetCommand === 'restore') {
      if (previousCameraStateRef.current) {
        animateCameraToTarget(
          previousCameraStateRef.current.pos,
          previousCameraStateRef.current.target
        );
        previousCameraStateRef.current = null;
        if (onPreviousViewChangeRef.current) onPreviousViewChangeRef.current(false);
      }
      return;
    }

    // Save previous user viewpoint before applying any preset so user can restore anytime!
    if (!previousCameraStateRef.current) {
      previousCameraStateRef.current = {
        pos: cam.position.clone(),
        target: ctrl.target.clone(),
      };
      if (onPreviousViewChangeRef.current) onPreviousViewChangeRef.current(true);
    }

    // Respect current camera distance from target so presets don't zoom the user in/out unintentionally
    const currentDist = cam.position.distanceTo(ctrl.target);
    const dist = Math.max(1.8, Math.min(12, currentDist || 4.8));
    const newPos = new THREE.Vector3();
    const newLookAt = ctrl.target.clone();

    if (cameraPresetCommand === 'front') {
      newPos.set(newLookAt.x, newLookAt.y, newLookAt.z + dist);
    } else if (cameraPresetCommand === 'top') {
      newPos.set(newLookAt.x, newLookAt.y + dist, newLookAt.z + 0.001);
    } else if (cameraPresetCommand === 'side') {
      newPos.set(newLookAt.x + dist, newLookAt.y, newLookAt.z);
    } else if (cameraPresetCommand === 'iso') {
      // True isometric diagonal (45° azimuth, ~35.26° elevation) where distance is strictly preserved
      const offset = dist * 0.57735;
      newPos.set(newLookAt.x + offset, newLookAt.y + offset, newLookAt.z + offset);
    } else if (cameraPresetCommand === 'reset') {
      newLookAt.set(0, 0, 0);
      newPos.set(3.2, 2.4, 4.2);
      previousCameraStateRef.current = null;
      if (onPreviousViewChangeRef.current) onPreviousViewChangeRef.current(false);
    }

    animateCameraToTarget(newPos, newLookAt);
  }, [cameraPresetCommand, animateCameraToTarget]);

  // 6. Camera Focus on Selected Annotation
  // 只换角度不放大：保持用户当前观察距离，把相机绕到锚点所在方位（模型中心 → 锚点延长线）
  useEffect(() => {
    if (!selectedAnnotationId || modelSource === 'none') return;
    const anno = annotations.find((a) => a.id === selectedAnnotationId);
    if (anno && currentModelGroupRef.current && cameraRef.current && controlsRef.current) {
      const scale = currentModelGroupRef.current.scale.x;
      const cam = cameraRef.current;
      const ctrl = controlsRef.current;

      const anchor = new THREE.Vector3(
        anno.anchorPoint[0] * scale,
        anno.anchorPoint[1] * scale,
        anno.anchorPoint[2] * scale
      );

      // 观察方向：从模型中心穿过锚点向外，相机落在锚点方位同距离处
      const viewDir = new THREE.Vector3().subVectors(anchor, modelCenterRef.current);
      if (viewDir.lengthSq() < 1e-9) viewDir.set(0, 0.4, 1);
      viewDir.normalize();

      // 距离保持用户当前值（滚轮缩放不受干扰），绝不放大
      const dist = cam.position.distanceTo(ctrl.target);
      const focusPos = anchor.clone().addScaledVector(viewDir, dist);

      // 注视点在模型中心与锚点之间偏中心，既对准标注又保留模型整体轮廓
      const focusLookAt = modelCenterRef.current.clone().lerp(anchor, 0.35);

      animateCameraToTarget(focusPos, focusLookAt);
    }
  }, [selectedAnnotationId, annotations, modelSource, animateCameraToTarget]);

  // 7. REAL 3D STRAIGHT POINTER LINES & ANCHOR DOTS IN THREE.JS SCENE
  useEffect(() => {
    const linesGroup = annotationLinesGroupRef.current;
    if (!linesGroup) return;

    // Clear previous
    while (linesGroup.children.length > 0) {
      const child = linesGroup.children[0];
      if (!child) break;
      if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
      linesGroup.remove(child);
    }

    if (!showAnnotations || modelSource === 'none' || !currentModelGroupRef.current) {
      requestRender();
      return;
    }

    const scale = currentModelGroupRef.current.scale.x;

    annotations.forEach((anno) => {
      if (anno.visible === false) return;
      const isSelected = selectedAnnotationId === anno.id;

      const pAnchor = new THREE.Vector3(
        anno.anchorPoint[0] * scale,
        anno.anchorPoint[1] * scale,
        anno.anchorPoint[2] * scale
      );

      const pLabel = computeEffectiveLabelPoint(anno, scale, new THREE.Vector3());

      // Direction from anchor to label
      const lineDir = new THREE.Vector3().subVectors(pLabel, pAnchor);
      const lineDirNorm = lineDir.clone().normalize();

      // Floating offset slightly along the line direction so the particle hovers cleanly above the surface
      const floatOffset = 0.012;
      const pFloatAnchor = pAnchor.clone().addScaledVector(lineDirNorm, floatOffset);

      // 1. Glowing Floating Particle Point at surface contact
      // A. Inner glowing particle core
      const coreGeo = new THREE.SphereGeometry(isSelected ? 0.024 : 0.016, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(isSelected ? '#ffffff' : '#67e8f9'),
        depthTest: false,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.copy(pFloatAnchor);
      linesGroup.add(coreMesh);

      // B. Outer soft luminous cyan glow halo
      const glowGeo = new THREE.SphereGeometry(isSelected ? 0.048 : 0.034, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#22d3ee'),
        transparent: true,
        opacity: isSelected ? 0.65 : 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.copy(pFloatAnchor);
      linesGroup.add(glowMesh);

      // C. Luminous contact guide ring on the surface plane
      const ringGeo = new THREE.RingGeometry(0.022, 0.036, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(isSelected ? '#a5f3fc' : '#06b6d4'),
        transparent: true,
        opacity: isSelected ? 0.75 : 0.45,
        side: THREE.DoubleSide,
        depthTest: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pFloatAnchor);
      ringMesh.lookAt(pLabel);
      linesGroup.add(ringMesh);

      // 2. Softer Semi-Transparent Cyan 3D Straight Pointer Line
      const linePoints = [pFloatAnchor, pLabel];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(isSelected ? '#a5f3fc' : '#22d3ee'),
        transparent: true,
        opacity: isSelected ? 0.95 : 0.62,
        depthTest: false,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      linesGroup.add(line);

      // 3. Small endpoint node docked to the label
      const endGeo = new THREE.SphereGeometry(0.015, 12, 12);
      const endMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(isSelected ? '#ffffff' : '#22d3ee'),
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      });
      const endMesh = new THREE.Mesh(endGeo, endMat);
      endMesh.position.copy(pLabel);
      linesGroup.add(endMesh);
    });

    requestRender();
  }, [annotations, showAnnotations, selectedAnnotationId, modelSource, requestRender, computeEffectiveLabelPoint]);

  // 8. Raycasting Click Handler
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!mountRef.current || !cameraRef.current || !currentModelGroupRef.current || modelSource === 'none') return;

      const rect = mountRef.current.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(mouse.current, cameraRef.current);
      const intersects = raycaster.current.intersectObjects(
        currentModelGroupRef.current.children,
        true
      );

      if (intersects.length > 0) {
        const hit = intersects[0];
        if (!hit) return;
        const scale = currentModelGroupRef.current.scale.x;

        const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        hit.object.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal));

        if (isAddMode) {
          const anchorX = hit.point.x / scale;
          const anchorY = hit.point.y / scale;
          const anchorZ = hit.point.z / scale;
          if (onSurfaceClickRef.current) {
            onSurfaceClickRef.current([anchorX, anchorY, anchorZ], [normal.x, normal.y, normal.z]);
          }
          return;
        }

        let closestAnnoId: string | null = null;
        let minDist = 0.5 * scale;

        for (const anno of annotationsRef.current) {
          const aVec = new THREE.Vector3(
            anno.anchorPoint[0] * scale,
            anno.anchorPoint[1] * scale,
            anno.anchorPoint[2] * scale
          );
          const d = hit.point.distanceTo(aVec);
          if (d < minDist) {
            minDist = d;
            closestAnnoId = anno.id;
          }
        }

        if (closestAnnoId && onSelectAnnotationRef.current) {
          soundFX.playFocus();
          onSelectAnnotationRef.current(closestAnnoId);
        }
      }
    },
    [isAddMode, modelSource]
  );

  return (
    <div
      ref={mountRef}
      onClick={handleCanvasClick}
      className={`relative w-full h-full select-none overflow-hidden ${
        isAddMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* 3D Line Endpoint Labels Overlay */}
      {showAnnotations &&
        modelSource !== 'none' &&
        annotations.map((anno) => {
          if (anno.visible === false) return null;
          const isSelected = selectedAnnotationId === anno.id;

          return (
            <div
              key={anno.id}
              data-annotation-id={anno.id}
              ref={(el) => {
                if (el) labelElementsMap.current.set(anno.id, el);
                else labelElementsMap.current.delete(anno.id);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                willChange: 'transform',
                display: 'none',
              }}
              onClick={(e) => {
                e.stopPropagation();
                soundFX.playFocus();
                onSelectAnnotation(anno.id);
              }}
              className={`group cursor-pointer pointer-events-auto transition-transform hover:scale-105 z-20 ${
                isSelected ? 'scale-110 z-30' : ''
              }`}
            >
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-white text-white shadow-cyan-500/30'
                    : 'bg-slate-950/85 hover:bg-slate-900 border-slate-700/80 text-slate-200 hover:text-white'
                }`}
                style={{
                  borderLeftColor: anno.color,
                  borderLeftWidth: '3.5px',
                }}
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs tracking-tight">{anno.title}</span>
                  {anno.category && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {anno.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

      {/* Add Mode Top Banner */}
      {isAddMode && modelSource !== 'none' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 font-bold px-5 py-2 rounded-full text-xs shadow-2xl backdrop-blur flex items-center gap-2 pointer-events-none z-30 animate-pulse">
          <span>请点击模型表面以添加 3D 空间直线与标签</span>
        </div>
      )}
    </div>
  );
};
