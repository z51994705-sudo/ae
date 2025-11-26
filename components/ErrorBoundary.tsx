import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white p-6">
          <div className="bg-slate-800 border border-red-500/50 rounded-xl p-8 max-w-lg w-full shadow-2xl">
            <h1 className="text-2xl font-bold text-red-400 mb-4">程序发生错误 (Application Error)</h1>
            <p className="text-slate-300 mb-4">很抱歉，程序遇到阻碍无法继续运行。</p>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 overflow-auto mb-6">
              <code className="text-xs text-red-300 font-mono break-all">
                {this.state.error?.toString()}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              刷新页面 (Reload Page)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}