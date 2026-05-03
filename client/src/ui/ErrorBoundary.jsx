import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="error-screen">
          <section>
            <h1>App error</h1>
            <p>{this.state.error.message}</p>
            <button onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}>
              Reset session
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
