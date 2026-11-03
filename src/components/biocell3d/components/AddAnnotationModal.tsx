import React, { useState } from 'react';
import { X, Tag, Check, Sliders, ArrowUpRight } from 'lucide-react';
import { ModelAnnotation } from '../types/annotation';
import { soundFX } from '../utils/audio';

interface AddAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorPoint: [number, number, number] | null;
  normal: [number, number, number] | null;
  onSave: (anno: ModelAnnotation) => void;
}

const PRESET_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#10b981', // emerald
  '#ec4899', // pink
  '#3b82f6', // blue
];

export const AddAnnotationModal: React.FC<AddAnnotationModalProps> = ({
  isOpen,
  onClose,
  anchorPoint,
  normal,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('结构特征');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [lineLength, setLineLength] = useState<number>(0.35);

  if (!isOpen || !anchorPoint || !normal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Calculate 3D label position along the normalized surface normal
    const nLen = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]) || 1;
    const nx = normal[0] / nLen;
    const ny = normal[1] / nLen;
    const nz = normal[2] / nLen;

    const labelX = anchorPoint[0] + nx * lineLength;
    const labelY = anchorPoint[1] + ny * lineLength;
    const labelZ = anchorPoint[2] + nz * lineLength;

    const newAnno: ModelAnnotation = {
      id: `anno-${Date.now()}`,
      title: title.trim(),
      category: category.trim() || '通用部件',
      description: description.trim(),
      anchorPoint,
      labelPoint: [labelX, labelY, labelZ],
      normal: [nx, ny, nz],
      color,
      createdAt: Date.now(),
    };

    soundFX.playTransition();
    onSave(newAnno);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">添加 3D 空间引线标签</h3>
              <p className="text-[11px] text-slate-400">在点击的模型表面生成空间直线与标签</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Coordinates preview */}
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">3D 原件锚点:</span>
            <span className="text-cyan-400">
              [{anchorPoint.map(v => v.toFixed(2)).join(', ')}]
            </span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              标签标题 / 部件名称 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：主轴承总成 / 细胞核膜孔 / 冷却叶片"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              类别 / 属性分类
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例如：核心动力件 / 遗传中枢 / 外部紧固"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              详细说明 / 技术参数
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入该部位的功能描述、工作原理、规格参数或生物生理特性..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          {/* Line Length Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                3D 指向线延伸距离:
              </label>
              <span className="font-mono text-cyan-400">{lineLength.toFixed(2)}m</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={lineLength}
              onChange={(e) => setLineLength(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>贴近 (0.1m)</span>
              <span>标准适中 (0.35m)</span>
              <span>拉开 (1.0m)</span>
            </div>
          </div>

          {/* Color preset chips */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              标注标识配色
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-900/30"
            >
              <Check className="w-3.5 h-3.5" />
              创建 3D 指向线标签
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
