import type { Task } from '../api';
import { Calendar, CheckCircle2, Circle, Edit2, Trash2, AlertTriangle, User, Briefcase } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
}) => {
  // Category configuration
  const getCategoryDetails = (cat: string) => {
    switch (cat) {
      case 'work':
        return {
          bg: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
          icon: <Briefcase className="w-3.5 h-3.5 mr-1" />,
          label: 'Công việc',
        };
      case 'urgent':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
          label: 'Khẩn cấp',
        };
      case 'personal':
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <User className="w-3.5 h-3.5 mr-1" />,
          label: 'Cá nhân',
        };
    }
  };

  // Priority configuration
  const getPriorityBadge = (pri: string) => {
    switch (pri) {
      case 'high':
        return 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-sm shadow-red-500/20';
      case 'medium':
        return 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-sm shadow-amber-500/20';
      case 'low':
      default:
        return 'bg-slate-700/80 text-slate-300';
    }
  };

  const catDetails = getCategoryDetails(task.category);

  // Format deadline date
  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    
    // Check if overdue
    const isOverdue = !task.completed && date < new Date();
    
    const formatted = date.toLocaleDateString('vi-VN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <span className={`flex items-center text-xs gap-1 font-medium ${isOverdue ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
        <Calendar className="w-3.5 h-3.5" />
        {formatted} {isOverdue && '(Trễ hạn)'}
      </span>
    );
  };

  return (
    <div
      className={`glass-panel glass-panel-hover p-4 rounded-xl flex flex-col justify-between gap-4 transition-all duration-300 ${
        task.completed ? 'opacity-60 border-slate-800' : 'border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3 justify-between">
        {/* Completion checkbox & title */}
        <div className="flex items-start gap-2.5 flex-1">
          <button
            onClick={() => onToggleComplete(task)}
            className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none"
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-indigo-400 fill-indigo-400/25" />
            ) : (
              <Circle className="w-5 h-5 text-slate-500 hover:scale-105 transition-transform" />
            )}
          </button>
          
          <div className="flex-1">
            <h3
              className={`font-semibold text-sm leading-snug break-words ${
                task.completed ? 'line-through text-slate-500' : 'text-slate-100'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 break-words">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Priority Badge */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityBadge(task.priority)}`}>
          {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'T.Bình' : 'Thấp'}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-1">
        {/* Category badge & Deadline */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center text-[10px] font-medium border px-2 py-0.5 rounded-md ${catDetails.bg}`}>
            {catDetails.icon}
            {catDetails.label}
          </span>
          {formatDeadline(task.deadline)}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 md:opacity-75 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            className="p-1 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 transition-all"
            title="Sửa công việc"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-all"
            title="Xóa công việc"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
