import type { Task } from '../api';
import { Sparkles, BarChart2, CheckSquare, Clock, AlertTriangle, Briefcase, User, Layers } from 'lucide-react';

interface SidebarProps {
  tasks: Task[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activePriority: string;
  setActivePriority: (pri: string) => void;
  activeStatus: string;
  setActiveStatus: (status: string) => void;
  onOpenSummary: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tasks,
  activeCategory,
  setActiveCategory,
  activePriority,
  setActivePriority,
  activeStatus,
  setActiveStatus,
  onOpenSummary,
}) => {
  // Statistics
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const work = tasks.filter((t) => t.category === 'work').length;
  const personal = tasks.filter((t) => t.category === 'personal').length;
  const urgent = tasks.filter((t) => t.category === 'urgent').length;

  return (
    <aside className="w-full lg:w-72 glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6 border-slate-800">
      <div className="flex flex-col gap-6">
        {/* Branding Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-200 via-slate-100 to-indigo-100 bg-clip-text text-transparent">
              TaskAI
            </h1>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
              Smart Productivity
            </p>
          </div>
        </div>

        {/* AI Action Button */}
        <button
          onClick={onOpenSummary}
          className="glow-btn w-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          Tóm tắt ngày với AI
        </button>

        <hr className="border-slate-800/80" />

        {/* Stats Section */}
        <div className="flex flex-col gap-2.5">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" />
            Thống kê
          </h2>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-3 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Hoàn thành</span>
              <span className="text-lg font-bold text-indigo-400 mt-0.5">{completed}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-3 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Đang làm</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5">{pending}</span>
            </div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng thái</h2>
          <div className="flex flex-col gap-1 mt-1">
            {[
              { id: 'all', label: 'Tất cả công việc', count: total, icon: <Layers className="w-4 h-4" /> },
              { id: 'active', label: 'Chưa hoàn thành', count: pending, icon: <Clock className="w-4 h-4" /> },
              { id: 'completed', label: 'Đã hoàn thành', count: completed, icon: <CheckSquare className="w-4 h-4" /> },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setActiveStatus(st.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                  activeStatus === st.id
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  {st.icon}
                  <span>{st.label}</span>
                </div>
                <span className="bg-slate-900/80 px-2 py-0.5 rounded-full font-bold text-[10px] border border-slate-800">
                  {st.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phân loại</h2>
          <div className="flex flex-col gap-1 mt-1">
            {[
              { id: 'all', label: 'Tất cả danh mục', count: total },
              { id: 'work', label: 'Công việc', count: work, icon: <Briefcase className="w-4 h-4 text-violet-400/80" /> },
              { id: 'personal', label: 'Cá nhân', count: personal, icon: <User className="w-4 h-4 text-emerald-400/80" /> },
              { id: 'urgent', label: 'Khẩn cấp', count: urgent, icon: <AlertTriangle className="w-4 h-4 text-rose-400/80" /> },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                  activeCategory === cat.id
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cat.icon || <Layers className="w-4 h-4 text-slate-500" />}
                  <span>{cat.label}</span>
                </div>
                <span className="bg-slate-900/80 px-2 py-0.5 rounded-full font-bold text-[10px] border border-slate-800">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filters */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ưu tiên</h2>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'high', label: 'Cao', activeColor: 'bg-red-500/20 text-red-400 border-red-500/30' },
              { id: 'medium', label: 'Trung bình', activeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
              { id: 'low', label: 'Thấp', activeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
            ].map((pri) => {
              const isActive = activePriority === pri.id;
              return (
                <button
                  key={pri.id}
                  onClick={() => setActivePriority(pri.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    isActive
                      ? pri.activeColor || 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 shadow-sm'
                      : 'bg-transparent text-slate-400 border-slate-800 hover:text-slate-300 hover:bg-slate-800/20'
                  }`}
                >
                  {pri.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[10px] text-slate-500 font-medium text-center">
        Powered by Gemini AI
      </div>
    </aside>
  );
};
