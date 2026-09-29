import React, { useState, useEffect } from 'react';
import type { Task } from '../api';
import { api } from '../api';
import { Sparkles, Calendar, Tag, AlertOctagon, X, Save, Plus } from 'lucide-react';

interface TaskFormProps {
  taskToEdit?: Task | null;
  onSubmit: (taskData: {
    title: string;
    description: string;
    category: 'work' | 'personal' | 'urgent';
    priority: 'low' | 'medium' | 'high';
    deadline: string | null;
  }) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  taskToEdit,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'work' | 'personal' | 'urgent'>('personal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [deadline, setDeadline] = useState<string>('');
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState('');

  // Hydrate if editing
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      if (taskToEdit.deadline) {
        // Format ISO date to YYYY-MM-DDThh:mm for input datetime-local
        const d = new Date(taskToEdit.deadline);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDeadline(formatted);
      } else {
        setDeadline('');
      }
    } else {
      setTitle('');
      setDescription('');
      setCategory('personal');
      setPriority('low');
      setDeadline('');
    }
    setSuggestError('');
  }, [taskToEdit]);

  // Handle AI Auto-fill suggestions
  const handleAISuggest = async () => {
    if (!title.trim()) {
      setSuggestError('Hãy nhập tiêu đề công việc trước khi sử dụng AI gợi ý.');
      return;
    }
    setSuggestError('');
    setIsSuggesting(true);
    try {
      const suggestion = await api.getSuggestions(title, description);
      setCategory(suggestion.category);
      setPriority(suggestion.priority);
      
      if (suggestion.deadline) {
        const d = new Date(suggestion.deadline);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDeadline(formatted);
      } else {
        setDeadline('');
      }
    } catch (err) {
      console.error('Suggest error:', err);
      setSuggestError('Không thể lấy gợi ý từ AI. Vui lòng chọn thủ công.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border-slate-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          {taskToEdit ? <Save className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-indigo-400" />}
          {taskToEdit ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {/* Title */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Tiêu đề <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Nộp báo cáo tài chính tuần"
              className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600"
            />
            
            {/* AI Auto-fill Button */}
            <button
              type="button"
              onClick={handleAISuggest}
              disabled={isSuggesting}
              className={`glow-btn px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isSuggesting 
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 active:scale-95'
              }`}
              title="Điền tự động với AI"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSuggesting ? 'animate-spin' : ''}`} />
              <span>{isSuggesting ? 'Đang phân tích...' : 'Gợi ý AI'}</span>
            </button>
          </div>
          {suggestError && (
            <p className="text-[10px] text-rose-400 mt-1 font-medium">{suggestError}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Mô tả chi tiết
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả thêm về công việc này..."
            rows={2}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600 resize-none"
          />
        </div>

        {/* Filters configuration inside Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Danh mục
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80 transition-all"
            >
              <option value="personal">Cá nhân</option>
              <option value="work">Công việc</option>
              <option value="urgent">Khẩn cấp</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" /> Độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80 transition-all"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Hạn chót
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2.2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/80 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 mt-2 border-t border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800/60 active:scale-95 transition-all"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="glow-btn bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{taskToEdit ? 'Cập nhật' : 'Tạo mới'}</span>
        </button>
      </div>
    </form>
  );
};
