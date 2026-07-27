/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Duellio Uncaught Boundary Error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-6 bg-neutral-950/90 border border-purple-500/30 rounded-3xl backdrop-blur-xl shadow-2xl mt-10">
          <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
            <AlertTriangle className="w-7 h-7" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white font-display tracking-tight">
              Session Execution Protected
            </h2>
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
              Duellio's security boundary intercepted an unexpected UI state anomaly. Your wallet coins and account progress remain completely safe.
            </p>
            {this.state.error && (
              <p className="text-[10px] font-mono text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20 max-w-md mx-auto truncate mt-2">
                {this.state.error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={this.handleReset}
              className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Rejoin Matchmaker
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = window.location.pathname;
              }}
              className="px-5 py-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Home className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
