import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Что-то пошло не так
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Произошла непредвиденная ошибка в приложении.
              </p>
            </div>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700 font-mono break-all">
                {this.state.error?.message || 'Неизвестная ошибка'}
              </p>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Перезагрузить приложение
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
