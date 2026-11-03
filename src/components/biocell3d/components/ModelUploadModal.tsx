import React, { useRef } from 'react';
import { 
  Upload, 
  X, 
  FileBox, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  HelpCircle,
  RotateCcw,
  Tag
} from 'lucide-react';
import { ModelStats } from '../types/annotation';
import { soundFX } from '../utils/audio';

interface ModelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  onResetToBuiltin: () => void;
  isCustomModelActive: boolean;
  modelStats: ModelStats | null;
  onEnableAddPinMode: () => void;
  isAddPinMode: boolean;
}

export const ModelUploadModal: React.FC<ModelUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onResetToBuiltin,
  isCustomModelActive,
  modelStats,
  onEnableAddPinMode,
  isAddPinMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
        soundFX.playTransition();
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file) return;
      soundFX.playTransition();
      onFileUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileBox className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">导入 3D 模型 (.glb / .gltf)</h2>
              <p className="text-xs text-slate-400">支持通用 GLTF 2.0 / GLB 格式二进制 3D 模型</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".glb,.gltf" 
              className="hidden" 
              onChange={handleFileChange}
            />
            <div className="w-14 h-14 rounded-full bg-slate-800 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-400 flex items-center justify-center mb-3 transition-colors">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-slate-200 group-hover:text-white">
              点击选择或将您的 <span className="text-cyan-400 font-mono">.glb / .gltf</span> 模型拖拽到这里
            </p>
            <p className="text-xs text-slate-500 mt-1">
              本地直接解析加载，数据安全不会上传至外部网络服务器
            </p>
          </div>

          {/* Model Status info */}
          {modelStats && isCustomModelActive && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  当前已载入自定义模型: {modelStats.fileName || 'custom-model.glb'}
                </span>
                <span className="text-xs font-mono text-slate-400">{modelStats.fileSize || ''}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Mesh 网格数</span>
                  <span className="font-mono font-bold text-cyan-400">{modelStats.meshCount}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">顶点总数</span>
                  <span className="font-mono font-bold text-cyan-400">{modelStats.vertexCount.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">三角面数</span>
                  <span className="font-mono font-bold text-cyan-400">{modelStats.triangleCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tagging Instructions & Actions */}
          <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              如何与标签系统交互？
            </div>
            <p className="text-slate-300 leading-relaxed">
              1. 系统支持在模型表面任意位置点击打标，自动生成柔和半透明引线与悬浮标签。<br />
              2. 载入您的 GLB 后，您可以直接在 3D 视口中点击模型表面部件，或点击【进入打点模式】创建专属说明标签！
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {isCustomModelActive ? (
            <button
              onClick={() => {
                soundFX.playClick();
                onResetToBuiltin();
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置为内置航发透平模型
            </button>
          ) : (
            <span className="text-xs text-slate-500">当前正在展示内置航发透平机械仿真模型</span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFX.playClick();
                onEnableAddPinMode();
                onClose();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isAddPinMode
                  ? 'bg-amber-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              {isAddPinMode ? '退出打点' : '进入打点添加标签模式'}
            </button>
            <button
              onClick={() => {
                soundFX.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
