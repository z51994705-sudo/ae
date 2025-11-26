import React from 'react';
import { HistoryItem, InputMode } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full mt-8 border-t border-slate-700/50 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">历史记录 (History)</h3>
        <button 
          onClick={onClear}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors px-3 py-1 rounded-full hover:bg-slate-800"
        >
          清空记录 (Clear All)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-800 hover:border-purple-500/30 transition-all duration-200 group flex items-start gap-3"
          >
            <div className={`mt-1 p-2 rounded-md ${item.mode === InputMode.TEXT ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
              {item.mode === InputMode.TEXT ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 text-sm font-medium truncate group-hover:text-white transition-colors">
                {item.querySnippet}
              </p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-slate-500">
                  {new Date(item.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs text-slate-600 bg-slate-800/80 px-1.5 py-0.5 rounded">
                  {item.results.length} 项
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
