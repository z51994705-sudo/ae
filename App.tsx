import React, { useState, useEffect } from 'react';
import { translateText, translateImage } from './services/geminiService';
import { TranslationItem, InputMode, HistoryItem } from './types';
import { FileUploader } from './components/FileUploader';
import { ResultsTable } from './components/ResultsTable';
import { HistoryList } from './components/HistoryList';

const HISTORY_STORAGE_KEY = 'ae_lingo_history';
const MAX_HISTORY_ITEMS = 10;

const App: React.FC = () => {
  const [mode, setMode] = useState<InputMode>(InputMode.TEXT);
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [results, setResults] = useState<TranslationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Save history helper
  const saveToHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
  };

  const addToHistory = (mode: InputMode, snippet: string, items: TranslationItem[]) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      mode,
      querySnippet: snippet,
      results: items
    };

    const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    saveToHistory(updatedHistory);
  };

  const clearHistory = () => {
    saveToHistory([]);
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    setResults(item.results);
    setMode(item.mode);
    setError(null);
    if (item.mode === InputMode.TEXT) {
      setInputText(item.querySnippet);
    }
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result as string;
              setMode(InputMode.IMAGE);
              setInputImage({ base64: result, mimeType: file.type });
              setError(null);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isLoading]);

  const handleTranslate = async () => {
    setError(null);
    setResults([]);

    try {
      setIsLoading(true);
      let data: TranslationItem[] = [];
      let snippet = '';

      if (mode === InputMode.TEXT) {
        if (!inputText.trim()) {
           setError("请输入需要翻译的参数名称");
           setIsLoading(false);
           return;
        }
        snippet = inputText.length > 30 ? inputText.substring(0, 30) + '...' : inputText;
        data = await translateText(inputText);
      } else {
        if (!inputImage) {
          setError("请上传或粘贴插件截图");
           setIsLoading(false);
           return;
        }
        snippet = "截图识别 (Image Translation)";
        data = await translateImage(inputImage.base64, inputImage.mimeType);
      }

      setResults(data);
      if (data.length === 0) {
        setError("未能识别到有效内容，请重试");
      } else {
        addToHistory(mode, snippet, data);
      }
    } catch (err) {
      setError("翻译服务暂时不可用，请稍后再试");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelected = (base64: string | null, mimeType: string | null) => {
    if (base64 && mimeType) {
      setInputImage({ base64, mimeType });
      setError(null);
    } else {
      setInputImage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-purple-500/30 pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* Header */}
        <header className="text-center space-y-2 pt-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
            AE Lingo
          </h1>
          <p className="text-slate-400 text-lg">After Effects 插件参数中英对照助手</p>
        </header>

        {/* Main Interface: Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* LEFT PANEL: Input & Controls 
              Fixed position: Sticky with max-height limits the panel to the viewport, 
              preventing it from scrolling away with the page content.
              Added pr-2 to prevent scrollbar overlap.
          */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto z-20 pr-2">
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-1 shadow-2xl backdrop-blur-sm">
              
              {/* Tabs */}
              <div className="flex w-full bg-slate-900/50 rounded-xl p-1 mb-6">
                <button
                  onClick={() => setMode(InputMode.TEXT)}
                  className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === InputMode.TEXT 
                      ? 'bg-slate-700 text-white shadow-lg ring-1 ring-slate-600' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                    文本翻译
                  </span>
                </button>
                <button
                  onClick={() => setMode(InputMode.IMAGE)}
                  className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === InputMode.IMAGE
                      ? 'bg-slate-700 text-white shadow-lg ring-1 ring-slate-600' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    截图识别
                  </span>
                </button>
              </div>

              {/* Input Area */}
              <div className="px-6 pb-6">
                {mode === InputMode.TEXT ? (
                  <div className="relative">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="在此输入英文参数名称..."
                      className="w-full h-[400px] bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none resize-none transition-all font-mono leading-relaxed"
                      spellCheck={false}
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-slate-500 pointer-events-none bg-slate-900/80 px-2 py-1 rounded">
                      支持批量输入
                    </div>
                  </div>
                ) : (
                  <FileUploader 
                    onImageSelected={handleImageSelected}
                    isLoading={isLoading}
                    preview={inputImage?.base64 || null}
                  />
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handleTranslate}
                  disabled={isLoading}
                  className={`w-full mt-6 py-4 rounded-xl font-bold text-lg tracking-wide transition-all duration-300 transform
                    ${isLoading 
                      ? 'bg-slate-700 text-slate-500 cursor-wait' 
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-purple-500/20 active:scale-[0.98]'
                    }
                  `}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      正在分析...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      开始翻译 
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Results 
              Let it scroll naturally with the page.
          */}
          <div className="flex flex-col min-h-[500px] bg-slate-800/40 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-sm relative transition-all duration-300">
            {results.length > 0 ? (
              <ResultsTable results={results} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 space-y-6">
                 <div className="w-32 h-32 rounded-full bg-slate-800/50 flex items-center justify-center border-2 border-dashed border-slate-700">
                    <svg className="w-16 h-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                 </div>
                 <div className="text-center">
                    <h3 className="text-xl font-medium text-slate-300 mb-2">等待翻译</h3>
                    <p className="text-sm max-w-xs mx-auto text-slate-500">
                      请在左侧上传图片或输入文本，AI 将自动解析参数并生成中英对照表。
                    </p>
                 </div>
                 {history.length > 0 && (
                   <p className="text-xs text-slate-600">或从下方历史记录中选择</p>
                 )}
              </div>
            )}
          </div>

        </div>

        {/* History Section */}
        <HistoryList 
          history={history} 
          onSelect={restoreHistoryItem} 
          onClear={clearHistory}
        />

        {/* Footer */}
        <footer className="text-center text-slate-600 text-sm mt-8 border-t border-slate-800 pt-8">
          <p>Powered by Google Gemini 2.5 Flash</p>
        </footer>

      </div>
    </div>
  );
};

export default App;