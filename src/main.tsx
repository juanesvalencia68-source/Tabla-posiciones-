import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { FirebaseProvider } from './contexts/FirebaseContext';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Error inesperado' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Captured by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#020617',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '28px', color: '#f59e0b', marginBottom: '16px' }}>
            👑 Tabla de Posiciones
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '600px', marginBottom: '24px' }}>
            Hubo un detalle al iniciar en este navegador. Pulsa el botón abajo para recargar la tabla.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#f59e0b',
              color: '#020617',
              border: 'none',
              padding: '12px 28px',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            Recargar Página
          </button>
          {this.state.errorMessage && (
            <p style={{ marginTop: '24px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
              {this.state.errorMessage}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
