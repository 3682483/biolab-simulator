import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { ModelAnnotation } from '../types/annotation';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Exports a fully self-contained, standalone interactive HTML webpage.
 * - Embedded Annotations: Embedded directly as JSON and rendered in 3D + DOM.
 * - Embedded Model Attachment: Embedded as Base64 binary attachment so it opens offline without a server.
 * - Local Attachment Support: Also includes an attachment file picker to attach/load other models.
 */
export async function exportStandaloneHTMLPage(
  modelGroup: THREE.Group,
  annotations: ModelAnnotation[],
  htmlFileName: string = 'model_viewer.html',
  customFile?: File | null
): Promise<void> {
  let modelBase64 = '';

  if (customFile) {
    const buffer = await customFile.arrayBuffer();
    modelBase64 = arrayBufferToBase64(buffer);
  } else {
    // Clone model meshes to export clean GLB buffer
    const exportScene = new THREE.Scene();
    const cloned = modelGroup.clone(true);
    cloned.position.set(0, 0, 0);
    cloned.scale.set(1, 1, 1);
    cloned.rotation.set(0, 0, 0);
    exportScene.add(cloned);

    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        exportScene,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            resolve(gltf);
          } else {
            const blob = new Blob([JSON.stringify(gltf, null, 2)], { type: 'application/json' });
            blob.arrayBuffer().then(resolve).catch(reject);
          }
        },
        (err) => reject(err),
        { binary: true }
      );
    });

    modelBase64 = arrayBufferToBase64(glbBuffer);
  }

  const annotationsJson = JSON.stringify(annotations);
  const pageTitle = htmlFileName.replace(/\.[^/.]+$/, '');

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} - 3D 模型独立交互浏览</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #060814;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #f1f5f9;
      user-select: none;
    }
    #viewport {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
    }
    /* Top Header */
    .top-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 20;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
    }
    .brand-box {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: #fff;
      font-size: 16px;
      box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35);
    }
    .brand-info h1 {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.3px;
    }
    .brand-info p {
      font-size: 11px;
      color: #94a3b8;
    }
    .header-badges {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-family: monospace;
      font-weight: 600;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(51, 65, 85, 0.8);
      color: #38bdf8;
      backdrop-filter: blur(8px);
    }
    .btn-attach {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(51, 65, 85, 0.8);
      color: #e2e8f0;
      font-size: 11px;
      padding: 5px 12px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn-attach:hover {
      background: rgba(30, 41, 59, 0.95);
      border-color: #06b6d4;
      color: #fff;
    }

    /* 3D Docked Label Elements */
    .annotation-label {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: auto;
      cursor: pointer;
      z-index: 10;
      transition: opacity 0.12s;
    }
    .label-card {
      padding: 6px 12px;
      border-radius: 10px;
      background: rgba(10, 15, 30, 0.88);
      border: 1px solid rgba(51, 65, 85, 0.8);
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 110px;
    }
    .label-card:hover {
      transform: scale(1.05);
      border-color: #38bdf8 !important;
      box-shadow: 0 6px 24px rgba(6, 182, 212, 0.4);
    }
    .label-title {
      font-size: 12px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
    }
    .label-cat {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 500;
    }

    /* Bottom Control Bar */
    .bottom-dock {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 25;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(10, 15, 30, 0.92);
      border: 1px solid rgba(30, 41, 59, 0.9);
      padding: 8px 16px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(12px);
      white-space: nowrap;
    }
    .dock-btn {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(51, 65, 85, 0.7);
      color: #cbd5e1;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s;
    }
    .dock-btn:hover {
      background: rgba(30, 41, 59, 1);
      color: #fff;
      border-color: #64748b;
    }
    .dock-btn.active {
      background: rgba(6, 182, 212, 0.2);
      border-color: rgba(6, 182, 212, 0.6);
      color: #38bdf8;
    }
    .dock-sep {
      width: 1px;
      height: 16px;
      background: rgba(51, 65, 85, 0.6);
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .modal-card {
      width: 100%;
      max-width: 440px;
      background: #090d1a;
      border: 1px solid #1e293b;
      border-radius: 18px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
      overflow: hidden;
      animation: modalIn 0.2s ease-out;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-head {
      padding: 14px 18px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .modal-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .modal-desc {
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.6;
    }
    .modal-coords {
      font-family: monospace;
      font-size: 11px;
      background: #030712;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #1e293b;
      color: #38bdf8;
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    .modal-close-btn:hover {
      color: #fff;
    }
  </style>

  <!-- Import maps polyfill & Three.js ES Modules from CDN -->
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>
  <div id="viewport"></div>

  <!-- Header -->
  <header class="top-header">
    <div class="brand-box">
      <div class="brand-logo">3D</div>
      <div class="brand-info">
        <h1>${pageTitle}</h1>
        <p>独立 3D 模型网页 · 内嵌全部空间直线引线与标签</p>
      </div>
    </div>
    <div class="header-badges">
      <span class="badge" id="annoBadge">内嵌标签: 0</span>
      <span class="badge" style="color: #34d399;" id="statusBadge">模型附件: 已就绪</span>
      <button class="btn-attach" onclick="document.getElementById('attachInput').click()">
        <span>📎 附加/更换本地模型</span>
      </button>
      <input type="file" id="attachInput" accept=".glb,.gltf" style="display: none;" />
    </div>
  </header>

  <!-- Bottom Floating Dock -->
  <div class="bottom-dock">
    <button class="dock-btn active" id="btnToggleLabels" onclick="toggleAnnotations()">
      <span>🏷️ 引线显示</span>
    </button>
    <button class="dock-btn active" id="btnToggleGrid" onclick="toggleGrid()">
      <span>🌐 网格开启</span>
    </button>
    <div class="dock-sep"></div>
    <span style="font-size: 11px; color: #94a3b8;">视角:</span>
    <button class="dock-btn" onclick="setCameraView('front')">正视</button>
    <button class="dock-btn" onclick="setCameraView('top')">俯视</button>
    <button class="dock-btn" onclick="setCameraView('side')">侧视</button>
    <button class="dock-btn" onclick="setCameraView('iso')">等轴测</button>
    <button class="dock-btn" style="color: #38bdf8;" onclick="setCameraView('reset')">复位</button>
    <div class="dock-sep"></div>
    <button class="dock-btn" onclick="takeScreenshot()">📷 截图</button>
  </div>

  <!-- Annotation Detail Modal -->
  <div class="modal-backdrop" id="detailModal" onclick="closeModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-head">
        <div>
          <h3 id="modalTitle" style="font-size: 15px; font-weight: 700; color: #fff;">标签详情</h3>
          <span id="modalCat" style="font-size: 11px; color: #38bdf8;">分类</span>
        </div>
        <button class="modal-close-btn" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p class="modal-desc" id="modalDesc">说明内容...</p>
        <div class="modal-coords" id="modalCoords">空间锚点: [0.00, 0.00, 0.00]</div>
      </div>
    </div>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    // 1. EMBEDDED DATA
    const EMBEDDED_MODEL_BASE64 = "${modelBase64}";
    const EMBEDDED_ANNOTATIONS = ${annotationsJson};

    document.getElementById('annoBadge').innerText = '内嵌标签: ' + EMBEDDED_ANNOTATIONS.length;

    let scene, camera, renderer, controls;
    let currentModel = null;
    let gridHelper = null;
    let linesGroup = null;
    let showLabels = true;
    let showGrid = true;
    const labelDoms = new Map();

    const _vec3 = new THREE.Vector3();
    const _screenVec = new THREE.Vector3();
    const _anchorVec = new THREE.Vector3();
    const _screenAnchorVec = new THREE.Vector3();

    function initScene() {
      const container = document.getElementById('viewport');
      const w = container.clientWidth;
      const h = container.clientHeight;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060814);

      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(3.2, 2.4, 4.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.appendChild(renderer.domElement);

      // Lights
      const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x1e1b4b, 0.9);
      scene.add(hemi);

      const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
      dirLight.position.set(4, 6, 5);
      scene.add(dirLight);

      const backLight = new THREE.DirectionalLight(0x818cf8, 1.2);
      backLight.position.set(-4, 3, -4);
      scene.add(backLight);

      // Grid Floor
      gridHelper = new THREE.GridHelper(5, 20, 0x1e293b, 0x0f172a);
      gridHelper.position.y = -0.5;
      scene.add(gridHelper);

      // Pointer lines & particles group
      linesGroup = new THREE.Group();
      scene.add(linesGroup);

      // Controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 0.8;
      controls.maxDistance = 14;

      window.addEventListener('resize', onWindowResize);

      // Render loop
      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        updateLabels2D();
        renderer.render(scene, camera);
      }
      animate();

      // Load initial model attachment
      if (EMBEDDED_MODEL_BASE64 && EMBEDDED_MODEL_BASE64.length > 100) {
        loadBase64Model(EMBEDDED_MODEL_BASE64);
      } else {
        document.getElementById('statusBadge').innerText = '请附加本地 GLB 模型';
        document.getElementById('statusBadge').style.color = '#f59e0b';
      }
    }

    function fitModelToView(model) {
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

      const targetDim = minViewportDim * 0.40;
      const finalScale = targetDim / maxDim;
      model.scale.setScalar(finalScale);

      // Reduce height above grid to ~1/4 of previous gap
      model.updateMatrixWorld(true);
      const scaledBox = new THREE.Box3().setFromObject(model);
      if (gridHelper) {
        gridHelper.position.y = scaledBox.min.y - 0.12;
      }
    }

    function build3DLines() {
      // Clear existing lines & DOM
      while (linesGroup.children.length > 0) {
        linesGroup.remove(linesGroup.children[0]);
      }
      labelDoms.forEach(el => el.remove());
      labelDoms.clear();

      const scale = currentModel ? currentModel.scale.x : 1;
      const container = document.getElementById('viewport');

      EMBEDDED_ANNOTATIONS.forEach((anno) => {
        if (anno.visible === false) return;
        const anchor = new THREE.Vector3(
          anno.anchorPoint[0] * scale,
          anno.anchorPoint[1] * scale,
          anno.anchorPoint[2] * scale
        );
        const labelPt = new THREE.Vector3(
          anno.labelPoint[0] * scale,
          anno.labelPoint[1] * scale,
          anno.labelPoint[2] * scale
        );

        // 1. Semi-transparent cyan pointer line
        const geom = new THREE.BufferGeometry().setFromPoints([anchor, labelPt]);
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(0x22d3ee),
          transparent: true,
          opacity: 0.62,
          depthTest: false,
          depthWrite: false
        });
        const line = new THREE.Line(geom, lineMat);
        line.renderOrder = 998;
        linesGroup.add(line);

        // 2. Glowing contact dot on model surface
        const dotGeom = new THREE.SphereGeometry(0.016 * scale, 16, 16);
        const dotMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(0x67e8f9),
          depthTest: false,
          depthWrite: false
        });
        const dotMesh = new THREE.Mesh(dotGeom, dotMat);
        dotMesh.position.copy(anchor);
        dotMesh.renderOrder = 999;
        linesGroup.add(dotMesh);

        // 3. Docked DOM Label Card
        const el = document.createElement('div');
        el.className = 'annotation-label';
        el.innerHTML = \`
          <div class="label-card">
            <span class="label-title">\${anno.title}</span>
            <span class="label-cat">\${anno.category || '部件标注'}</span>
          </div>
        \`;
        el.onclick = () => openModal(anno);
        container.appendChild(el);
        labelDoms.set(anno.id, el);
      });
    }

    function updateLabels2D() {
      const container = document.getElementById('viewport');
      const w = container.clientWidth;
      const h = container.clientHeight;
      const scale = currentModel ? currentModel.scale.x : 1;

      EMBEDDED_ANNOTATIONS.forEach((anno) => {
        const el = labelDoms.get(anno.id);
        if (!el) return;

        if (!showLabels || !currentModel) {
          el.style.display = 'none';
          return;
        }

        _vec3.set(
          anno.labelPoint[0] * scale,
          anno.labelPoint[1] * scale,
          anno.labelPoint[2] * scale
        );
        _screenVec.copy(_vec3).project(camera);

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
          _screenAnchorVec.copy(_anchorVec).project(camera);
          const isRight = screenX >= (_screenAnchorVec.x * 0.5 + 0.5) * w;

          el.style.display = 'block';
          if (isRight) {
            el.style.transform = \`translate3d(\${Math.round(screenX)}px, \${Math.round(screenY)}px, 0) translate(0%, -50%)\`;
          } else {
            el.style.transform = \`translate3d(\${Math.round(screenX)}px, \${Math.round(screenY)}px, 0) translate(-100%, -50%)\`;
          }

          const card = el.firstElementChild;
          if (card) {
            if (isRight) {
              card.style.borderLeft = \`3.5px solid \${anno.color || '#06b6d4'}\`;
              card.style.borderRight = '1px solid rgba(51, 65, 85, 0.8)';
            } else {
              card.style.borderRight = \`3.5px solid \${anno.color || '#06b6d4'}\`;
              card.style.borderLeft = '1px solid rgba(51, 65, 85, 0.8)';
            }
          }
        }
      });
    }

    function loadBase64Model(base64Str) {
      const binary = atob(base64Str);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      parseAndDisplayGLB(bytes.buffer);
    }

    function parseAndDisplayGLB(buffer) {
      const loader = new GLTFLoader();
      loader.parse(
        buffer,
        '',
        (gltf) => {
          if (currentModel) {
            scene.remove(currentModel);
          }
          currentModel = gltf.scene;
          fitModelToView(currentModel);
          scene.add(currentModel);

          build3DLines();
          document.getElementById('statusBadge').innerText = '模型附件: 已加载';
          document.getElementById('statusBadge').style.color = '#34d399';
        },
        (err) => console.error('Failed to parse model', err)
      );
    }

    // Attach local file
    document.getElementById('attachInput').addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            parseAndDisplayGLB(ev.target.result);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });

    function onWindowResize() {
      const container = document.getElementById('viewport');
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Window globals for UI buttons
    window.toggleAnnotations = function() {
      showLabels = !showLabels;
      linesGroup.visible = showLabels;
      const btn = document.getElementById('btnToggleLabels');
      if (showLabels) {
        btn.classList.add('active');
        btn.innerHTML = '<span>🏷️ 引线显示</span>';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span>🏷️ 引线隐藏</span>';
      }
    };

    window.toggleGrid = function() {
      showGrid = !showGrid;
      if (gridHelper) gridHelper.visible = showGrid;
      const btn = document.getElementById('btnToggleGrid');
      if (showGrid) {
        btn.classList.add('active');
        btn.innerHTML = '<span>🌐 网格开启</span>';
      } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span>🌐 网格关闭</span>';
      }
    };

    window.setCameraView = function(preset) {
      const dist = 4.8;
      if (preset === 'front') camera.position.set(0, 0, dist);
      else if (preset === 'top') camera.position.set(0, dist, 0.001);
      else if (preset === 'side') camera.position.set(dist, 0, 0);
      else if (preset === 'iso') camera.position.set(dist * 0.7, dist * 0.7, dist * 0.7);
      else if (preset === 'reset') camera.position.set(3.2, 2.4, 4.2);
      controls.target.set(0, 0, 0);
      controls.update();
    };

    window.takeScreenshot = function() {
      // 1. Force a fresh render
      renderer.render(scene, camera);
      updateLabels2D();

      const canvas = renderer.domElement;
      const compCanvas = document.createElement('canvas');
      compCanvas.width = canvas.width;
      compCanvas.height = canvas.height;
      const ctx = compCanvas.getContext('2d');
      if (!ctx) return;

      // Draw 3D scene
      ctx.drawImage(canvas, 0, 0);

      // Composite visible label cards and text
      if (showLabels && EMBEDDED_ANNOTATIONS.length > 0) {
        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / canvasRect.width;
        const scaleY = canvas.height / canvasRect.height;

        EMBEDDED_ANNOTATIONS.forEach((anno) => {
          const el = labelDoms.get(anno.id);
          if (!el || el.style.display === 'none') return;
          const card = el.firstElementChild;
          if (!card) return;

          const rect = card.getBoundingClientRect();
          const bx = (rect.left - canvasRect.left) * scaleX;
          const by = (rect.top - canvasRect.top) * scaleY;
          const bw = rect.width * scaleX;
          const bh = rect.height * scaleY;

          if (bx + bw < 0 || bx > compCanvas.width || by + bh < 0 || by > compCanvas.height) return;

          ctx.save();
          // Shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
          ctx.shadowBlur = 10 * scaleX;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4 * scaleY;

          // Background
          const radius = 10 * scaleX;
          ctx.fillStyle = 'rgba(10, 15, 30, 0.92)';
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, radius);
          ctx.fill();

          // Border
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.85)';
          ctx.lineWidth = 1 * scaleX;
          ctx.stroke();

          // Accent bar
          const isRight = card.style.borderLeft && card.style.borderLeft.includes('solid');
          const barWidth = 3.5 * scaleX;
          ctx.shadowColor = 'transparent';
          ctx.fillStyle = anno.color || '#06b6d4';
          ctx.beginPath();
          if (isRight) {
            ctx.roundRect(bx, by, barWidth, bh, [radius, 0, 0, radius]);
          } else {
            ctx.roundRect(bx + bw - barWidth, by, barWidth, bh, [0, radius, radius, 0]);
          }
          ctx.fill();

          // Text
          const textX = bx + 12 * scaleX + (isRight ? barWidth / 2 : 0);
          const titleFontSize = Math.round(12 * scaleY);
          ctx.fillStyle = '#ffffff';
          ctx.font = \`bold \${titleFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif\`;
          ctx.textBaseline = 'top';
          const titleY = anno.category ? by + 7 * scaleY : by + (bh - titleFontSize) / 2;
          ctx.fillText(anno.title, textX, titleY);

          if (anno.category) {
            const catFontSize = Math.round(10 * scaleY);
            ctx.fillStyle = '#94a3b8';
            ctx.font = \`\${catFontSize}px monospace, -apple-system, sans-serif\`;
            ctx.textBaseline = 'top';
            ctx.fillText(anno.category, textX, by + 23 * scaleY);
          }

          ctx.restore();
        });
      }

      const dataURL = compCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = '${pageTitle}-with-labels.png';
      a.href = dataURL;
      a.click();
    };

    window.openModal = function(anno) {
      document.getElementById('modalTitle').innerText = anno.title;
      document.getElementById('modalCat').innerText = anno.category || '空间部件标注';
      document.getElementById('modalDesc').innerText = anno.description || '暂无详细描述';
      document.getElementById('modalCoords').innerText = '空间锚点坐标: [' +
        anno.anchorPoint.map(v => v.toFixed(3)).join(', ') + ']';
      document.getElementById('detailModal').style.display = 'flex';
    };

    window.closeModal = function() {
      document.getElementById('detailModal').style.display = 'none';
    };

    initScene();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = URL.createObjectURL(blob);
  downloadAnchor.download = htmlFileName;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
