import React, { useState, useEffect, useRef } from 'react';
import { TranslationItem } from '../types';

interface ResultsTableProps {
  results: TranslationItem[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // Reset selection when results refresh
  useEffect(() => {
    setSelectedIndex(-1);
    rowRefs.current = rowRefs.current.slice(0, results.length);
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in input/textarea
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Only handle if we have results
      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev + 1;
          return next < results.length ? next : prev;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev - 1;
          return next >= 0 ? next : 0;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results.length]);

  // Smooth scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0 && rowRefs.current[selectedIndex]) {
      rowRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  if (results.length === 0) return null;

  return (
    // Removed h-full and overflow-y-auto to let the table grow with content
    <div className="w-full relative">
      <table className="w-full text-left border-collapse relative">
        <thead className="sticky top-0 z-10 shadow-lg">
          <tr className="border-b border-slate-700 bg-slate-800 text-slate-400 text-sm uppercase tracking-wider">
            <th className="p-4 font-semibold w-[30%] whitespace-nowrap bg-slate-800">英文参数 (EN)</th>
            <th className="p-4 font-semibold w-[30%] text-purple-400 whitespace-nowrap bg-slate-800">中文翻译 (CN)</th>
            <th className="p-4 font-semibold w-[40%] bg-slate-800">新手说明 (Note)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {results.map((item, index) => {
            const isSelected = selectedIndex === index;
            return (
              <tr 
                key={index} 
                ref={el => { rowRefs.current[index] = el; }}
                onClick={() => setSelectedIndex(index)}
                className={`
                  transition-all duration-300 ease-out group cursor-pointer border-l-4
                  ${isSelected 
                    ? 'bg-purple-500/10 border-purple-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]' 
                    : 'border-transparent hover:bg-slate-700/30 hover:border-slate-600'
                  }
                `}
              >
                <td className={`p-4 font-mono text-sm font-medium align-top break-words transition-colors ${isSelected ? 'text-purple-100' : 'text-slate-200'}`}>
                  {item.original}
                </td>
                <td className="p-4 align-top break-words">
                  <div className={`transition-all duration-300 origin-left ${isSelected ? 'transform scale-105' : ''}`}>
                    <span className={`font-bold text-base inline-block transition-all duration-300 ${
                      isSelected 
                        ? 'text-white bg-purple-600 px-3 py-1.5 rounded-lg shadow-[0_4px_12px_rgba(147,51,234,0.4)] border border-purple-400/50' 
                        : 'text-purple-400/90'
                    }`}>
                      {item.translated}
                    </span>
                  </div>
                </td>
                <td className={`p-4 text-sm align-top leading-relaxed break-words transition-colors ${isSelected ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {item.description}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
