import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Camera, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Compass,
  Grid
} from 'lucide-react';
import { soundFX } from '../utils/audio';

interface UniversalControlDockProps {
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onCameraPreset: (preset: 'front' | 'top' | 'side' | 'iso' | 'reset' | 'restore') => void;
  onTakeScreenshot: () => void;
  annotationCount: number;
  isLabelManagerOpen?: boolean;
  onToggleLabelManager?: () => void;
  activePreset?: string | null;
  hasPreviousView?: boolean;
}

export const UniversalControlDock: React.FC<UniversalControlDockProps> = ({
  showAnnotations,
  onToggleAnnotations,
  showGrid,
  onToggleGrid,
  onCameraPreset,
  onTakeScreenshot,
  annotationCount,
  isLabelManagerOpen,
  onToggleLabelManager,
  activePreset,
  hasPreviousView,
}) => {
  const [audioEnabled, setAudioEnabled] = useState(false);

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    soundFX.setEnabled(next);
    if (next) soundFX.playClick();
  };

  const handlePresetClick = (preset: 'front' | 'top' | 'side' | 'iso') => {
    soundFX.playClick();
    if (activePreset === preset) {
      // Clicking the already active preset restores the previous custom view
      onCameraPreset('restore');
    } else {
      onCameraPreset(preset);
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center pointer-events-auto">
      {/* Sleek single-row dock with NO scrollbars */}
      <div className="bg-slate-950/92 border border-slate-800/90 rounded-2xl shadow-2xl px-4 py-2 text-slate-200 backdrop-blur-md flex items-center gap-2.5 whitespace-nowrap select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* Left: Annotation Visibility & Count */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFX.playClick();
              onToggleAnnotations();
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showAnnotations
                ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={showAnnotations ? '隐藏全部3D引线与标签' : '显示3D引线与标签'}
          >
            {showAnnotations ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showAnnotations ? '引线显示' : '引线隐藏'}</span>
          </button>

          <button
            onClick={() => {
              if (onToggleLabelManager) {
                soundFX.playClick();
                onToggleLabelManager();
              }
            }}
            className={`text-[11px] font-mono px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
              isLabelManagerOpen
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="点击打开/关闭标签列表管理面板"
          >
            <span>标签管理:</span>
            <strong className="text-cyan-400">{annotationCount}</strong>
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800/80" />

        {/* Middle: Engineering Camera Presets */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[11px] flex items-center gap-1 mr-0.5">
            <Compass className="w-3 h-3 text-cyan-400" />
            视角:
          </span>
          <button
            onClick={() => handlePresetClick('front')}
            className={`px-2 py-1 rounded-lg border text-xs transition-colors ${
              activePreset === 'front'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-semibold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
            title="正视（沿 Z 轴正面观察，再次点击恢复原视角）"
          >
            正视
          </button>
          <button
            onClick={() => handlePresetClick('top')}
            className={`px-2 py-1 rounded-lg border text-xs transition-colors ${
              activePreset === 'top'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-semibold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
            title="俯视（沿 Y 轴自顶向下观察，再次点击恢复原视角）"
          >
            俯视
          </button>
          <button
            onClick={() => handlePresetClick('side')}
            className={`px-2 py-1 rounded-lg border text-xs transition-colors ${
              activePreset === 'side'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-semibold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
            title="侧视（沿 X 轴从右侧观察，再次点击恢复原视角）"
          >
            侧视
          </button>
          <button
            onClick={() => handlePresetClick('iso')}
            className={`px-2 py-1 rounded-lg border text-xs transition-colors ${
              activePreset === 'iso'
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-semibold shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
            title="等轴测（标准工程三维立体俯瞰角，各坐标轴均等投影，再次点击可直接恢复原视角）"
          >
            等轴测
          </button>

          {/* Restore Previous User View button if user had a custom viewpoint */}
          {hasPreviousView && (
            <button
              onClick={() => {
                soundFX.playClick();
                onCameraPreset('restore');
              }}
              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs flex items-center gap-1 transition-all animate-in fade-in zoom-in-95"
              title="一键恢复到点击预设视角之前的自定义观察角度"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>恢复视角</span>
            </button>
          )}

          <button
            onClick={() => {
              soundFX.playClick();
              onCameraPreset('reset');
            }}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 text-xs flex items-center gap-1 transition-colors"
            title="重置视角到初始默认居中位置"
          >
            <RotateCcw className="w-3 h-3" />
            <span>复位</span>
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800/80" />

        {/* Right: Grid, Screenshot & Audio */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              soundFX.playClick();
              onToggleGrid();
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              showGrid
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={showGrid ? '关闭底面参考网格' : '开启底面参考网格'}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onTakeScreenshot();
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="导出高清渲染截图"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleAudio}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title={audioEnabled ? '静音' : '开启音效'}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>
    </div>
  );
};
