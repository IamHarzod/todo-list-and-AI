import { useState, useEffect } from 'react';
import type { Task } from './api';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import { ChatPanel } from './components/ChatPanel';
import { SummaryModal } from './components/SummaryModal';
import { Plus, Search, MessageSquare, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePriority, setActivePriority] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');

  // UI Panels
  const [isCreating, setIsCreating] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please check backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleComplete = async (task: Task) => {
    try {
      await api.updateTask(task.id, { completed: !task.completed });
      loadTasks();
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleFormSubmit = async (taskData: {
    title: string;
    description: string;
    category: 'work' | 'personal' | 'urgent';
    priority: 'low' | 'medium' | 'high';
    deadline: string | null;
  }) => {
    try {
      if (taskToEdit) {
        await api.updateTask(taskToEdit.id, taskData);
      } else {
        await api.createTask(taskData);
      }
      setIsCreating(false);
      setTaskToEdit(null);
      loadTasks();
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  // Filter & Search logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === 'all' || task.category === activeCategory;
    const matchesPriority = activePriority === 'all' || task.priority === activePriority;

    let matchesStatus = true;
    if (activeStatus === 'active') matchesStatus = !task.completed;
    if (activeStatus === 'completed') matchesStatus = task.completed;

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-4 lg:p-8 gap-6 max-w-7xl mx-auto">
      <Sidebar
        tasks={tasks}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activePriority={activePriority}
        setActivePriority={setActivePriority}
        activeStatus={activeStatus}
        setActiveStatus={setActiveStatus}
        onOpenSummary={() => setIsSummaryOpen(true)}
      />

      <main className="flex-1 flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Bảng công việc
              <span className="text-xs bg-indigo-500/10 text-indigo-400 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/25">
                {filteredTasks.length} task
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hôm nay, {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`glow-btn px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                isChatOpen
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/15'
                  : 'bg-slate-900 border-slate-800 text-indigo-400 border-indigo-500/20 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat Trợ lý AI
            </button>

            <button
              onClick={() => {
                setTaskToEdit(null);
                setIsCreating(!isCreating);
              }}
              className="glow-btn bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus className="w-4 h-4" />
              Thêm task
            </button>
          </div>
        </header>

        <section className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm công việc bằng từ khóa..."
              className="w-full bg-slate-900/65 border border-slate-850 glass-panel rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all placeholder:text-slate-600"
            />
          </div>
          <button
            onClick={loadTasks}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:scale-95 transition-all"
            title="Làm mới trang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </section>

        {(isCreating || taskToEdit) && (
          <section className="transition-all duration-300">
            <TaskForm
              taskToEdit={taskToEdit}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsCreating(false);
                setTaskToEdit(null);
              }}
            />
          </section>
        )}

        <section className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-400 font-medium animate-pulse">Đang tải danh sách công việc...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-rose-400 gap-2.5 glass-panel rounded-2xl border-rose-500/20">
              <AlertCircle className="w-8 h-8" />
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={loadTasks}
                className="mt-1.5 px-4 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-300"
              >
                Tải lại trang
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-2xl border-slate-850 bg-slate-950/10">
              <div className="w-11 h-11 rounded-full bg-slate-900/60 border border-slate-800/80 flex items-center justify-center text-slate-600 mb-3.5">
                <Sparkles className="w-5 h-5 text-indigo-500/40" />
              </div>
              <h3 className="text-xs font-bold text-slate-300">Không có công việc nào</h3>
              <p className="text-[11px] text-slate-500 max-w-[280px] mt-1.5 leading-relaxed">
                Hãy click "Thêm task" hoặc chat với Trợ lý AI ở thanh trên để tạo công việc đầu tiên nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={(t) => {
                    setTaskToEdit(t);
                    setIsCreating(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onTasksUpdated={loadTasks}
      />

      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
      />
    </div>
  );
}

export default App;
