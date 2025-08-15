import React from 'react';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Check if it's a Firestore error
    if (error.message && error.message.includes('FIRESTORE')) {
      console.warn('Firestore error detected, attempting to recover...');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <FiAlertCircle className="text-4xl text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4 max-w-md">
            We encountered an error while loading this content. This might be a temporary issue.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiRefreshCw />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;