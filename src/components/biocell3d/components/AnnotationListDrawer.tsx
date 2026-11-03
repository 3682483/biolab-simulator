import React, { useState, useMemo } from 'react';
import { ModelAnnotation } from '../types/annotation';
import { 
  X, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  CheckSquare, 
  Square, 
  Crosshair, 
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { soundFX } from '../utils/audio';

interface AnnotationListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  annotations: ModelAnnotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onSetAllVisibility: (visible: boolean) => void;
  onDeleteSingle: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
}

export const AnnotationListDrawer: React.FC<AnnotationListDrawerProps> = ({
  isOpen,
  onClose,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onToggleVisibility,
  onSetAllVisibility,
  onDeleteSingle,
  onBatchDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Filter annotations based on search query
  const filteredAnnotations = useMemo(() => {
    if (!searchQuery.trim()) return annotations;
    const query = searchQuery.toLowerCase().trim();
    return annotations.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        (a.description && a.description.toLowerCase().includes(query))
    );
  }, [annotations, searchQuery]);

  // Counts
  const visibleCount = useMemo(
    () => annotations.filter((a) => a.visible !== false).length,
    [annotations]
  );

  const allFilteredSelected = useMemo(() => {
    if (filteredAnnotations.length === 0) return false;
    return filteredAnnotations.every((a) => selectedIds.has(a.id));
  }, [filteredAnnotations, selectedIds]);

  const someFilteredSelected = useMemo(() => {
    return filteredAnnotations.some((a) => selectedIds.has(a.id)) && !allFilteredSelected;
  }, [filteredAnnotations, selectedIds, allFilteredSelected]);

  // Toggle selection for all filtered items
  const handleToggleSelectAll = () => {
    soundFX.playClick();
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredAnnotations.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredAnnotations.forEach((a) => next.add(a.id));
        return next;
      });
    }
  };

  // Toggle selection for a single item
  const handleToggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Execute batch deletion
  const handleConfirmBatchDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;
    soundFX.playTransition();
    onBatchDelete(idsToDelete);
    setSelectedIds(new Set());
    setShowBatchDeleteConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed top-14 right-4 bottom-20 w-84 sm:w-96 z-40 flex flex-col bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200 select-none text-slate-100"
      aria-label="标签列表管理面板"
    >
      {/* 1. Header */}
      <div className="px-4 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">标签列表管理</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-semibold">
                {annotations.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">控制可见性 · 批量多选删除 · 定位聚焦</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="关闭标签列表面板"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Search Box */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索标签名称、部件类型..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-slate-500 hover:text-slate-300"
              title="清空搜索"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Batch Action Bar */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
        {/* Multi-select toggle */}
        <button
          onClick={handleToggleSelectAll}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          title={allFilteredSelected ? '取消全选' : '全选所有标签'}
        >
          {allFilteredSelected ? (
            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
          ) : someFilteredSelected ? (
            <div className="w-3.5 h-3.5 rounded border border-cyan-400 bg-cyan-400/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-sm" />
            </div>
          ) : (
            <Square className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="text-[11px] font-medium">
            {allFilteredSelected ? '取消全选' : '全选'}
          </span>
        </button>

        {/* Global visibility actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSetAllVisibility(true)}
            className="px-2 py-0.8 rounded text-[11px] text-slate-300 hover:text-cyan-300 hover:bg-slate-800 flex items-center gap-1 transition-colors"
            title="全部显示所有标签"
          >
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>全显</span>
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => onSetAllVisibility(false)}
            className="px-2 py-0.8 rounded text-[11px] text-slate-300 hover:text-amber-300 hover:bg-slate-800 flex items-center gap-1 transition-colors"
            title="全部关闭隐藏所有标签"
          >
            <EyeOff className="w-3 h-3 text-slate-400" />
            <span>全隐</span>
          </button>
        </div>

        {/* Batch delete trigger button */}
        {selectedIds.size > 0 && (
          <button
            onClick={() => setShowBatchDeleteConfirm(true)}
            className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-md shadow-red-950 transition-all active:scale-95 animate-in fade-in"
            title="批量删除已选中的标签"
          >
            <Trash2 className="w-3 h-3" />
            <span>删除 ({selectedIds.size})</span>
          </button>
        )}
      </div>

      {/* Confirmation Dialog for Batch Delete */}
      {showBatchDeleteConfirm && (
        <div className="p-3 bg-red-950/80 border-b border-red-800/80 flex flex-col gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-red-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>确定删除选中的 {selectedIds.size} 个标签吗？此操作不可逆。</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowBatchDeleteConfirm(false)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
            >
              取消
            </button>
            <button
              onClick={handleConfirmBatchDelete}
              className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] shadow"
            >
              确认批量删除
            </button>
          </div>
        </div>
      )}

      {/* 4. Scrollable List of Annotations */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5 custom-scrollbar">
        {filteredAnnotations.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 p-4 text-center">
            <SlidersHorizontal className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-xs text-slate-400">
              {searchQuery ? '没有找到符合搜索条件的标签' : '当前暂无任何标签'}
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              {searchQuery ? '请尝试其他关键词' : '可在顶部点击“点击模型打标”在模型上生成标签'}
            </p>
          </div>
        ) : (
          filteredAnnotations.map((anno) => {
            const isSelectedInList = selectedIds.has(anno.id);
            const isFocusedIn3D = selectedAnnotationId === anno.id;
            const isVisible = anno.visible !== false;

            return (
              <div
                key={anno.id}
                onClick={() => {
                  soundFX.playFocus();
                  onSelectAnnotation(anno.id);
                }}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isFocusedIn3D
                    ? 'bg-cyan-950/40 border-cyan-500/70 shadow-sm shadow-cyan-950'
                    : isSelectedInList
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/70 hover:border-slate-700'
                } ${!isVisible ? 'opacity-50' : 'opacity-100'}`}
              >
                {/* Left: Checkbox + Color Tag + Title Info */}
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {/* Select Checkbox */}
                  <button
                    onClick={(e) => handleToggleSelectItem(anno.id, e)}
                    className="text-slate-400 hover:text-white shrink-0 p-0.5"
                    title={isSelectedInList ? '取消选择' : '选择此标签'}
                  >
                    {isSelectedInList ? (
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600 hover:text-slate-400" />
                    )}
                  </button>

                  {/* Color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: anno.color }}
                  />

                  {/* Title and Category */}
                  <div className="min-w-0 flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                        {anno.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="text-[9px] px-1 py-0.2 rounded font-mono font-medium border"
                        style={{
                          borderColor: `${anno.color}44`,
                          backgroundColor: `${anno.color}15`,
                          color: anno.color,
                        }}
                      >
                        {anno.category}
                      </span>
                      {anno.description && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {anno.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions: Eye Toggle (Show/Hide) + 3D Focus + Delete */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Toggle Individual Visibility */}
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onToggleVisibility(anno.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isVisible
                        ? 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/50'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                    title={isVisible ? '关闭此标签（隐藏）' : '开启此标签（显示）'}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* 3D Focus Camera Target */}
                  <button
                    onClick={() => {
                      soundFX.playFocus();
                      onSelectAnnotation(anno.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                    title="在 3D 场景中视角定位"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>

                  {/* Single Delete */}
                  <button
                    onClick={() => {
                      soundFX.playClick();
                      onDeleteSingle(anno.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    title="删除此标签"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Footer Status */}
      <div className="px-3.5 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span>总计: {annotations.length}</span>
          <span>·</span>
          <span className="text-cyan-300">显示: {visibleCount}</span>
          <span>·</span>
          <span className={selectedIds.size > 0 ? 'text-amber-300 font-semibold' : 'text-slate-500'}>
            已选: {selectedIds.size}
          </span>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white transition-colors underline"
          >
            清空选择
          </button>
        )}
      </div>
    </aside>
  );
};
