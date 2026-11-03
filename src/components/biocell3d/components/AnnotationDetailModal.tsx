import React, { useState } from 'react';
import { ModelAnnotation } from '../types/annotation';
import { 
  X, 
  Tag, 
  Trash2, 
  Sliders, 
  Edit3, 
  Check, 
  Layers, 
  Calendar,
  Volume2,
  Crosshair
} from 'lucide-react';
import { soundFX } from '../utils/audio';

interface AnnotationDetailModalProps {
  annotation: ModelAnnotation | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: ModelAnnotation) => void;
  onFocus: (anno: ModelAnnotation) => void;
}

export const AnnotationDetailModal: React.FC<AnnotationDetailModalProps> = ({
  annotation,
  onClose,
  onDelete,
  onUpdate,
  onFocus,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  if (!annotation) return null;

  const startEdit = () => {
    setTitle(annotation.title);
    setCategory(annotation.category);
    setDescription(annotation.description);
    setIsEditing(true);
  };

  const saveEdit = () => {
    onUpdate({
      ...annotation,
      title: title.trim() || annotation.title,
      category: category.trim() || annotation.category,
      description: description.trim() || annotation.description,
    });
    setIsEditing(false);
    soundFX.playClick();
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-h-[84vh] z-40 bg-slate-950/90 border border-slate-700/70 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-6 duration-200">
      {/* Header */}
      <div 
        className="px-5 py-4 border-b border-slate-800 flex items-start justify-between"
        style={{
          background: `linear-gradient(135deg, ${annotation.color}22 0%, rgba(15, 23, 42, 0.5) 100%)`
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-lg border border-white/20"
            style={{ backgroundColor: annotation.color }}
          >
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{annotation.title}</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-slate-900/80 text-cyan-300 border border-slate-700">
              {annotation.category || '通用结构部件'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.playClick();
            onClose();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4 overflow-y-auto space-y-4 text-xs">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">标签名称</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">分类/类型</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">详细说明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                保存修改
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-slate-400 font-semibold mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                部件说明与功能解析
              </h3>
              <p className="text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                {annotation.description || '暂无详细说明'}
              </p>
            </div>

            {/* Specifications list if available */}
            {annotation.specs && annotation.specs.length > 0 && (
              <div>
                <h3 className="text-slate-400 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
                  技术参数与特征
                </h3>
                <div className="bg-slate-900/40 rounded-xl border border-slate-800 divide-y divide-slate-800/60 overflow-hidden">
                  {annotation.specs.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2.5">
                      <span className="text-slate-400">{item.key}</span>
                      <span className="text-slate-200 font-mono text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3D Coordinate specs */}
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>3D 原件锚点位置:</span>
                <span className="font-mono text-cyan-400">
                  [{annotation.anchorPoint.map(v => v.toFixed(2)).join(', ')}]
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>3D 指向线端点 (标签):</span>
                <span className="font-mono text-purple-400">
                  [{annotation.labelPoint.map(v => v.toFixed(2)).join(', ')}]
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={() => {
            soundFX.playFocus();
            onFocus(annotation);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>镜头对准此标注</span>
        </button>

        <div className="flex items-center gap-1.5">
          {!isEditing && (
            <button
              onClick={startEdit}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="编辑内容"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              soundFX.playClick();
              onDelete(annotation.id);
              onClose();
            }}
            className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 transition-colors"
            title="删除此标签"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
