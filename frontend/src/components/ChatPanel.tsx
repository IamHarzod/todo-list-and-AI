import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../api';
import { api } from '../api';
import { Send, Sparkles, MessageSquare, Trash2, X, RefreshCw } from 'lucide-react';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksUpdated: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  onTasksUpdated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history
  const loadHistory = async () => {
    try {
      const history = await api.getChatHistory();
      setMessages(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistically add user message locally
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.sendChatMessage(userText);
      
      // Update with database messages to align IDs and contents
      setMessages((prev) => {
        // filter out the temporary message and replace with official ones
        const listWithoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        return [...listWithoutTemp, response.userMessage, response.assistantMessage];
      });

      // Reload tasks if there were modifications
      onTasksUpdated();
    } catch (err) {
      console.error('Chat error:', err);
      // Add system error message
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '❌ Rất tiếc, đã có lỗi kết nối xảy ra khi gửi tin nhắn đến AI. Hãy thử lại.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện không?')) return;
    try {
      await api.clearChatHistory();
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] z-50 glass-panel border-l border-slate-800 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              Trợ lý AI TaskAI
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </h2>
            <p className="text-[10px] text-slate-400">Quản lý task bằng ngôn ngữ tự nhiên</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={loadHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Tải lại lịch sử"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Xóa lịch sử chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Đóng chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-950/20">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 mb-3 float-animation">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200">Trò chuyện với trợ lý TaskAI</h3>
            <p className="text-[11px] text-slate-500 max-w-[280px] mt-1.5 leading-relaxed">
              Bạn có thể nói: <br />
              *"Thêm công việc Đi mua sắm tối nay"* <br />
              *"Xong công việc báo cáo"* <br />
              *"Xóa task dọn dẹp"*
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line break-words font-sans">
                    {msg.content}
                  </div>
                  <span className="block text-[8px] text-slate-400 text-right mt-1.5 font-medium">
                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/90 border border-slate-800 text-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">AI đang xử lý...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập yêu cầu (ví dụ: 'Thêm task học bài tối nay')..."
          disabled={isLoading}
          className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all placeholder:text-slate-600 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-lg hover:shadow-indigo-500/15 disabled:opacity-40 disabled:hover:shadow-none active:scale-95 transition-all flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
