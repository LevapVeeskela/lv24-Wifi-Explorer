import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Last-resort renderer boundary. Keeps a crash from becoming a white screen and
 * gives the user a recovery path without losing the whole shell.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep the message (no secrets) in the console for bug reports.
    console.error('LV24 renderer crash', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          alignItems: 'center',
          background: '#17130F',
          color: '#F5EFE6',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          gap: 12,
          height: '100vh',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0 }}>LV24 WiFi Explorer</h1>
        <p style={{ margin: 0, maxWidth: 560, opacity: 0.8 }}>
          The UI hit an unexpected error. Scan data is safe; reload the window to continue.
        </p>
        <code style={{ fontSize: 12, maxWidth: 720, opacity: 0.6, overflowWrap: 'anywhere' }}>
          {error.message}
        </code>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#FB6E4A',
            border: 0,
            borderRadius: 8,
            color: '#17130F',
            cursor: 'pointer',
            fontWeight: 700,
            padding: '10px 18px',
          }}
          type="button"
        >
          Reload
        </button>
      </div>
    );
  }
}
