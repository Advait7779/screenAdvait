import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

interface StartupErrorBoundaryState {
  error: Error | null;
}

class StartupErrorBoundary extends React.Component<
  React.PropsWithChildren,
  StartupErrorBoundaryState
> {
  state: StartupErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): StartupErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ScreenAdvait renderer failed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-lg">
          <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold mb-4">
            !
          </div>
          <h1 className="text-lg font-bold text-slate-900">ScreenAdvait could not load</h1>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            The desktop interface encountered an unexpected startup error. Reload the application
            to recover without affecting saved screenshots or your protected license.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 w-full rounded-md bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StartupErrorBoundary>
      <App />
    </StartupErrorBoundary>
  </React.StrictMode>
);
