import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 把全站包在 ErrorBoundary 內，避免任何元件 throw 造成白畫面。
// 本檔自定義 RootErrorBoundary（下方 class），包住 <App />。
const Fallback = ({ error }) => (
  <div className="min-h-screen bg-red-50 text-red-900 p-6">
    <div className="max-w-3xl mx-auto bg-white border border-red-200 rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold mb-2">發生未預期的錯誤</h2>
      <pre className="text-xs bg-red-50 border border-red-200 rounded-lg p-4 whitespace-pre-wrap font-mono">
        {error?.message}
        {'\n'}
        {error?.stack}
      </pre>
    </div>
  </div>
);

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[RootErrorBoundary]', error, info.componentStack);
  }
  render() {
    const { error } = this.state;
    if (error) {
      return <Fallback error={error} />;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
