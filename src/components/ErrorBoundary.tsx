import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Keeps one broken page from blanking the whole app; data in storage is untouched. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="banner banner-error" role="alert">
        <div>
          <strong>Something went wrong on this page. / حدث خطأ في هذه الصفحة.</strong>
          <div className="small">{this.state.error.message}</div>
          <div className="small">Your data is still saved on this device. / بياناتك ما زالت محفوظة على هذا الجهاز.</div>
        </div>
        <button className="btn btn-sm" onClick={() => this.setState({ error: null })}>
          ↻
        </button>
      </div>
    );
  }
}
