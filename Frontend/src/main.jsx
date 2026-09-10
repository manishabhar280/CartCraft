import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    try {
      JSON.parse(localStorage.getItem('cartcraft_user') || 'null');
    } catch {
      localStorage.removeItem('cartcraft_user');
      localStorage.removeItem('cartcraft_token');
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="startup-shell startup-error" role="alert">
          <h1>CartCraft could not load</h1>
          <p>Reload the page to try again.</p>
          <button className="btn btn-primary" onClick={this.handleReload}>
            Reload CartCraft
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = document.getElementById('root');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);
