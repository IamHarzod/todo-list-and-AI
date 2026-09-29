import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { X, Sparkles, CheckSquare, ListTodo, HelpCircle } from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.getDailySummary();
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to get summary:', err);
      setError('Không thể tạo tóm tắt công việc lúc này. Hãy thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Extremely clean helper to render markdown lines manually to avoid installing dependency
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();

      // Bold text formatting helper
      const formatBold = (str: string) => {
        const parts = str.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) => {
          if (i % 2 === 1) {
            return <strong key={i} className="text-slate-100 font-bold">{part}</strong>;
          }
          return part;
        });
      };

      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-indigo-400 mt-5 mb-2.5 flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
            <CheckSquare className="w-4.5 h-4.5" />
            {formatBold(trimmed.substring(3))}
          </h2>
        );
      }
      
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-slate-100 mt-4 mb-2 flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-cyan-400" />
            {formatBold(trimmed.substring(4))}
          </h3>
        );
      }
      
      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} className="text-xs text-slate-300 ml-4 pl-1 list-disc mb-1.5 leading-relaxed">
            {formatBold(trimmed.substring(2))}
          </li>
        );
      }

      if (trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="text-xs text-slate-300 ml-4 pl-1 list-disc mb-1.5 leading-relaxed">
            {formatBold(trimmed.substring(2))}
          </li>
        );
      }
      
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      
      return (
        <p key={idx} className="text-xs text-slate-300 mb-2 leading-relaxed">
          {formatBold(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl glass-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Báo cáo công việc hàng ngày
              </h2>
              <p className="text-[10px] text-slate-400">Được phân tích và tóm tắt bởi Gemini AI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-950/20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs text-slate-400 font-medium animate-pulse">
                Gemini AI đang phân tích danh sách công việc của bạn...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-rose-400 gap-2">
              <HelpCircle className="w-8 h-8" />
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={fetchSummary}
                className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-200 border border-slate-700/50"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="markdown-body text-slate-300 font-sans">
              {renderMarkdown(summary)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="glow-btn bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl active:scale-95 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/10"
          >
            Đóng báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};
