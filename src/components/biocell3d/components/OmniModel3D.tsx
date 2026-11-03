// OmniModel3D：仿真模型库 3D 查看器（融合自 biolab_tags_tools 的 App.tsx）
// 页面内嵌版：容器高度自适应路由布局；内置航发透平机械演示模型一个案例。
import { useState, useEffect, useRef, useCallback } from 'react';
import { CellViewer } from './CellViewer';
import { UniversalControlDock } from './UniversalControlDock';
import { AnnotationDetailModal } from './AnnotationDetailModal';
import { AddAnnotationModal } from './AddAnnotationModal';
import { ModelUploadModal } from './ModelUploadModal';
import { AnnotationListDrawer } from './AnnotationListDrawer';
import { MECHANICAL_ANNOTATIONS } from '../data/defaultAnnotations';
import { ModelAnnotation, ModelStats } from '../types/annotation';
import { soundFX } from '../utils/audio';
import { exportModelWithAnnotationsToGLB } from '../utils/glbExporter';
import { exportStandaloneHTMLPage } from '../utils/htmlExporter';
import { Box, Upload, Download, Tag, RotateCcw, Globe, ListFilter } from 'lucide-react';

type ModelSource = 'none' | 'custom' | 'demo-mech';

export default function OmniModel3D() {
  // Model state: initially 'none' — 空态显示模型库选择卡片
  const [modelSource, setModelSource] = useState<ModelSource>('none');
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [demoTrigger, setDemoTrigger] = useState<number>(0);

  // Global Drag and Drop over window
  const [isWindowDragOver, setIsWindowDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Annotations state with 3D straight pointer lines
  const [annotations, setAnnotations] = useState<ModelAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  // Add Annotation Modal state
  const [isAddMode, setIsAddMode] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<[number, number, number] | null>(null);
  const [pendingNormal, setPendingNormal] = useState<[number, number, number] | null>(null);

  // Camera & auxiliary controls (Annotation & Grid visibility)
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [cameraPresetCommand, setCameraPresetCommand] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [hasPreviousView, setHasPreviousView] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Label Management Panel state (Default Closed as required)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState<boolean>(false);

  // Exporters state
  const [isExportingGLB, setIsExportingGLB] = useState(false);
  const [isExportingHTML, setIsExportingHTML] = useState(false);
  const getModelGroupRef = useRef<(() => any) | null>(null);

  // Stable callback for Model Stats to prevent render loops
  const handleModelLoaded = useCallback((stats: ModelStats) => {
    setModelStats(stats);
  }, []);

  const handleRegisterGetModelGroup = useCallback((fn: () => any) => {
    getModelGroupRef.current = fn;
  }, []);

  // Export standalone HTML webpage containing embedded annotations and model attachment
  const handleExportHTML = async () => {
    if (!getModelGroupRef.current) return;
    const modelGroup = getModelGroupRef.current();
    if (!modelGroup) return;

    try {
      setIsExportingHTML(true);
      soundFX.playTransition();
      const baseName = modelStats?.fileName
        ? modelStats.fileName.replace(/\.[^/.]+$/, '')
        : 'BioModel_Annotated';

      await exportStandaloneHTMLPage(modelGroup, annotations, `${baseName}_standalone_viewer.html`, customFile);
      soundFX.playFocus();
    } catch (err) {
      console.error('Failed to export HTML', err);
    } finally {
      setIsExportingHTML(false);
    }
  };

  // Package model and 3D annotations together into a new GLB
  const handleExportGLB = async () => {
    if (!getModelGroupRef.current) return;
    const modelGroup = getModelGroupRef.current();
    if (!modelGroup) return;

    try {
      setIsExportingGLB(true);
      soundFX.playTransition();
      const baseName = modelStats?.fileName
        ? modelStats.fileName.replace(/\.[^/.]+$/, '')
        : 'BioModel_Annotated';

      await exportModelWithAnnotationsToGLB(modelGroup, annotations, `${baseName}_with_3d_labels.glb`);
      soundFX.playFocus();
    } catch (err) {
      console.error('Failed to export GLB', err);
    } finally {
      setIsExportingGLB(false);
    }
  };

  // Save new annotation
  const handleSaveAnnotation = useCallback((newAnno: ModelAnnotation) => {
    setAnnotations((prev) => [...prev, newAnno]);
    setIsAddMode(false);
    setSelectedAnnotationId(newAnno.id);
  }, []);

  // Delete single annotation
  const handleDeleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setSelectedAnnotationId((curr) => (curr === id ? null : curr));
  }, []);

  // Toggle individual annotation visibility
  const handleToggleVisibility = useCallback((id: string) => {
    soundFX.playClick();
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, visible: a.visible === false ? true : false } : a)),
    );
  }, []);

  // Bulk set visibility for all annotations
  const handleSetAllVisibility = useCallback((visible: boolean) => {
    soundFX.playClick();
    setAnnotations((prev) => prev.map((a) => ({ ...a, visible })));
  }, []);

  // Batch delete multiple annotations
  const handleBatchDelete = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    soundFX.playTransition();
    const idSet = new Set(ids);
    setAnnotations((prev) => prev.filter((a) => !idSet.has(a.id)));
    setSelectedAnnotationId((curr) => (curr && idSet.has(curr) ? null : curr));
  }, []);

  // Update annotation
  const handleUpdateAnnotation = useCallback((updated: ModelAnnotation) => {
    setAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  // Export annotations to JSON file
  const handleExportJSON = useCallback(() => {
    soundFX.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(annotations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `3d-model-annotations-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [annotations]);

  // Import annotations from JSON file
  const handleImportJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          soundFX.playTransition();
          setAnnotations(imported);
        }
      } catch (err) {
        console.error('Failed to parse annotations JSON', err);
      }
    };
    reader.readAsText(file);
  }, []);

  // Handle custom file upload
  const handleFileUpload = useCallback((file: File) => {
    soundFX.playTransition();
    setCustomFile(file);
    setModelSource('custom');
    setAnnotations([]); // Start fresh for user model
    setSelectedAnnotationId(null);
    setIsUploadOpen(false);
  }, []);

  // Load Mechanical Aerospace Turbine Demo（通用 GLB 打标能力演示）
  const handleLoadMechDemo = useCallback(() => {
    soundFX.playTransition();
    setCustomFile(null);
    setModelSource('demo-mech');
    setAnnotations(MECHANICAL_ANNOTATIONS);
    setDemoTrigger((p) => p + 1);
    setSelectedAnnotationId(null);
  }, []);

  // Clear / Unload back to empty
  const handleClearModel = useCallback(() => {
    soundFX.playClick();
    setModelSource('none');
    setCustomFile(null);
    setModelStats(null);
    setAnnotations([]);
    setSelectedAnnotationId(null);
  }, []);

  // Global Drag & Drop on window
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsWindowDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragOver(false);
      if (e.dataTransfer?.files?.[0]) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
          handleFileUpload(file);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleFileUpload]);

  // Composited screenshot export (WebGL 3D Scene + HTML DOM Labels & Text Boxes)
  const takeScreenshotRef = useRef<(() => void) | null>(null);

  const handleRegisterTakeScreenshot = useCallback((fn: () => void) => {
    takeScreenshotRef.current = fn;
  }, []);

  const handleTakeScreenshot = useCallback(() => {
    soundFX.playClick();
    if (takeScreenshotRef.current) {
      takeScreenshotRef.current();
    } else {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `3d-model-inspection-${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    }
  }, []);

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId) || null;

  return (
    <div className="relative h-[calc(100dvh-11rem)] min-h-[560px] w-full overflow-hidden rounded-2xl border border-border bg-slate-950 font-sans text-slate-100 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleImportJSON(e.target.files[0]);
          }
        }}
      />

      {/* Global Drag-over glowing backdrop */}
      {isWindowDragOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center border-4 border-dashed border-cyan-400 bg-cyan-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="mb-4 flex h-20 w-20 animate-bounce items-center justify-center rounded-3xl border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-2xl">
            <Upload className="h-10 w-10" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">松开鼠标即可导入任意 3D 模型</h2>
          <p className="text-sm text-cyan-200">自动等比缩放至 40% 视口比例，支持任意部件 3D 空间直线打标与 GLB 重新打包</p>
        </div>
      )}

      {/* Sleek Top Navigation Bar */}
      <header className="pointer-events-none absolute top-0 right-0 left-0 z-20 flex items-center justify-between px-3 py-2.5 sm:px-5">
        {/* Left Brand Badge */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-md shadow-cyan-900/20">
            <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-slate-950">
              <Box className="h-3.5 w-3.5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-sm font-bold tracking-tight text-transparent">
                仿真模型库
              </h1>
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider uppercase ${
                  modelSource === 'none'
                    ? 'border-slate-700 bg-slate-900 text-slate-400'
                    : modelSource === 'custom'
                      ? 'border-emerald-700 bg-emerald-950/80 text-emerald-300'
                      : 'border-purple-700 bg-purple-950/80 text-purple-300'
                }`}
              >
                {modelSource === 'none'
                  ? '等待导入'
                  : modelSource === 'custom'
                    ? modelStats?.fileName || '自定义模型'
                    : '3D 模型'}
              </span>
            </div>
            <p className="hidden text-[10px] text-slate-400 md:block">
              通用 3D 模型空间打标 · 独立网页与 GLB 导出
            </p>
          </div>
        </div>

        {/* Right Top Header Actions */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* JSON Backup & Restore Actions */}
          {modelSource !== 'none' && (
            <div className="flex items-center gap-0.5 rounded-lg border border-slate-700/80 bg-slate-900/80 p-0.5 backdrop-blur">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                title="导出标注数据备份 JSON"
              >
                <Download className="h-3 w-3 text-emerald-400" />
                <span>备份</span>
              </button>
              <button
                onClick={() => jsonInputRef.current?.click()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                title="从备份 JSON 恢复标注数据"
              >
                <Upload className="h-3 w-3 text-purple-400" />
                <span>恢复</span>
              </button>
            </div>
          )}

          {/* Export Standalone HTML Webpage Button */}
          {modelSource !== 'none' && (
            <button
              onClick={handleExportHTML}
              disabled={isExportingHTML}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-2.5 py-1 text-xs font-medium text-white shadow-md shadow-cyan-900/30 backdrop-blur transition-all hover:from-cyan-500 hover:to-blue-500 active:scale-95 disabled:opacity-50"
              title="导出包含内嵌模型附件与打标标签的独立 HTML 网页"
            >
              <Globe className="h-3 w-3" />
              <span>{isExportingHTML ? '生成中...' : '导出网页'}</span>
            </button>
          )}

          {/* Export Packaged GLB Button */}
          {modelSource !== 'none' && (
            <button
              onClick={handleExportGLB}
              disabled={isExportingGLB}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 py-1 text-xs font-medium text-white shadow-md shadow-emerald-900/30 backdrop-blur transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-50"
              title="将当前模型与所有3D空间引线、标签打包为全新GLB文件下载"
            >
              <Download className="h-3 w-3" />
              <span>{isExportingGLB ? '打包中...' : '打包 GLB'}</span>
            </button>
          )}

          {/* Label Management Panel Toggle Button */}
          {modelSource !== 'none' && (
            <button
              onClick={() => {
                soundFX.playClick();
                setIsLabelManagerOpen(!isLabelManagerOpen);
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium shadow-md backdrop-blur transition-all ${
                isLabelManagerOpen
                  ? 'border border-cyan-400 bg-cyan-600 font-bold text-white shadow-cyan-900/30'
                  : 'border border-slate-700/80 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="打开/关闭标签列表管理面板（多选删除、显隐控制）"
            >
              <ListFilter className="h-3 w-3 text-cyan-400" />
              <span>标签</span>
              <span className="rounded border border-slate-700 bg-slate-800 px-1 font-mono text-[10px] text-cyan-300">
                {annotations.length}
              </span>
            </button>
          )}

          {/* Add Annotation Button */}
          {modelSource !== 'none' && (
            <button
              onClick={() => {
                soundFX.playClick();
                setIsAddMode(!isAddMode);
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium shadow-md backdrop-blur transition-all ${
                isAddMode
                  ? 'border border-amber-400 bg-amber-500 font-bold text-slate-950'
                  : 'border border-slate-700/80 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="在模型表面点击打标"
            >
              <Tag className="h-3 w-3 text-amber-400" />
              <span>{isAddMode ? '完成' : '打标'}</span>
            </button>
          )}

          {/* Clear or Re-import */}
          {modelSource !== 'none' && (
            <button
              onClick={handleClearModel}
              className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              title="清空当前模型"
            >
              <RotateCcw className="h-3 w-3" />
              <span>清空</span>
            </button>
          )}

          {/* Import GLB Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1 text-xs font-medium text-white shadow-md shadow-blue-900/30 backdrop-blur transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-95"
            title={modelSource === 'none' ? '导入 GLB 模型' : '更换为其他 GLB 模型'}
          >
            <Upload className="h-3 w-3" />
            <span>{modelSource === 'none' ? '导入' : '更换'}</span>
          </button>
        </div>
      </header>

      {/* 3D Model Scene Viewport */}
      <main className="h-full w-full">
        <CellViewer
          modelSource={modelSource}
          showAnnotations={showAnnotations}
          showGrid={showGrid}
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          onSelectAnnotation={(id) => setSelectedAnnotationId(id)}
          isAddMode={isAddMode}
          onSurfaceClick={(anchor, norm) => {
            setPendingAnchor(anchor);
            setPendingNormal(norm);
          }}
          customFile={customFile}
          demoTrigger={demoTrigger}
          onModelLoaded={handleModelLoaded}
          cameraPresetCommand={cameraPresetCommand}
          onPreviousViewChange={setHasPreviousView}
          onManualOrbit={() => {
            setActivePreset(null);
          }}
          onRegisterGetModelGroup={handleRegisterGetModelGroup}
          onRegisterTakeScreenshot={handleRegisterTakeScreenshot}
        />
      </main>

      {/* Central Empty State: 仿真模型库选择卡 */}
      {modelSource === 'none' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4">
          <div className="pointer-events-auto flex w-full max-w-xl animate-in fade-in zoom-in-95 flex-col items-center rounded-3xl border border-slate-700/70 bg-slate-950/85 p-6 text-center shadow-2xl backdrop-blur-xl duration-300 sm:p-8">
            {/* Glowing Icon */}
            <div className="relative mb-5 flex items-center justify-center">
              <div className="absolute h-20 w-20 rounded-full bg-cyan-500/20 blur-xl" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-xl">
                <Box className="h-8 w-8 animate-pulse text-cyan-300" />
              </div>
            </div>

            <h2 className="mb-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
              仿真模型库 · 3D 交互与空间打标系统
            </h2>
            <p className="mb-6 max-w-md text-xs leading-relaxed text-slate-300 sm:text-sm">
              内置机械工程演示模型，亦可将任意生物 / 工程{" "}
              <span className="font-mono font-semibold text-cyan-400">.glb / .gltf</span>{" "}
              模型拖入页面：自动缩放至 <span className="font-mono font-semibold text-cyan-400">40% 黄金视口比例</span>
              ，支持 3D 空间直线打标、标签管理、截图与独立网页导出。
            </p>

            {/* Drag & Drop Action Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group mb-5 flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-500/40 bg-slate-900/60 p-5 transition-all hover:border-cyan-400 hover:bg-slate-900/90"
            >
              <Upload className="mb-2 h-6 w-6 text-cyan-400 transition-transform group-hover:scale-110" />
              <span className="text-xs font-semibold text-slate-100 group-hover:text-white sm:text-sm">
                点击选择文件，或直接拖拽任意 <span className="font-mono text-cyan-400">.glb / .gltf</span> 到此
              </span>
              <span className="mt-1 text-[11px] text-slate-400">纯前端本地加载，模型数据完全私密安全</span>
            </div>

            {/* 内置模型：航发透平机械演示 */}
            <div className="flex w-full items-center justify-center pt-1">
              <button
                onClick={handleLoadMechDemo}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-900/30 transition-all hover:from-cyan-500 hover:to-blue-500 sm:w-auto"
              >
                <span className="text-base transition-transform group-hover:rotate-45">⚙️</span>
                <span>载入：航发透平机械演示模型</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Annotation Detail Modal */}
      <AnnotationDetailModal
        annotation={selectedAnnotation}
        onClose={() => setSelectedAnnotationId(null)}
        onDelete={handleDeleteAnnotation}
        onUpdate={handleUpdateAnnotation}
        onFocus={(anno) => setSelectedAnnotationId(anno.id)}
      />

      {/* Add 3D Annotation Modal */}
      <AddAnnotationModal
        isOpen={!!pendingAnchor && !!pendingNormal}
        onClose={() => {
          setPendingAnchor(null);
          setPendingNormal(null);
        }}
        anchorPoint={pendingAnchor}
        normal={pendingNormal}
        onSave={handleSaveAnnotation}
      />

      {/* GLB File Upload & Inspect Modal */}
      <ModelUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileUpload={handleFileUpload}
        onResetToBuiltin={handleLoadMechDemo}
        isCustomModelActive={modelSource === 'custom'}
        modelStats={modelStats}
        onEnableAddPinMode={() => setIsAddMode(true)}
        isAddPinMode={isAddMode}
      />

      {/* Universal Bottom Control Dock (Single row toolbar) */}
      {modelSource !== 'none' && (
        <UniversalControlDock
          showAnnotations={showAnnotations}
          onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          activePreset={activePreset}
          hasPreviousView={hasPreviousView}
          onCameraPreset={(cmd) => {
            if (cmd === 'restore' || cmd === 'reset') {
              setActivePreset(null);
            } else {
              setActivePreset(cmd);
            }
            setCameraPresetCommand(cmd);
            setTimeout(() => setCameraPresetCommand(null), 50);
          }}
          onTakeScreenshot={handleTakeScreenshot}
          annotationCount={annotations.length}
          isLabelManagerOpen={isLabelManagerOpen}
          onToggleLabelManager={() => setIsLabelManagerOpen(!isLabelManagerOpen)}
        />
      )}

      {/* Label List Management Panel (Default closed) */}
      {modelSource !== 'none' && (
        <AnnotationListDrawer
          isOpen={isLabelManagerOpen}
          onClose={() => setIsLabelManagerOpen(false)}
          annotations={annotations}
          selectedAnnotationId={selectedAnnotationId}
          onSelectAnnotation={(id) => setSelectedAnnotationId(id)}
          onToggleVisibility={handleToggleVisibility}
          onSetAllVisibility={handleSetAllVisibility}
          onDeleteSingle={handleDeleteAnnotation}
          onBatchDelete={handleBatchDelete}
        />
      )}
    </div>
  );
}
