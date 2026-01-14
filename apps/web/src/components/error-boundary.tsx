'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-6">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        An unexpected error occurred. Please try refreshing the page or navigate back to the dashboard.
                    </p>
                    {this.state.error && (
                        <details className="mb-6 text-left bg-muted p-4 rounded-lg max-w-lg w-full">
                            <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                            <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={this.handleReset}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                        <Button onClick={() => window.location.href = '/dashboard'}>
                            <Home className="w-4 h-4 mr-2" />
                            Go to Dashboard
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for functional components
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    const handleError = React.useCallback((error: Error) => {
        console.error('Handled error:', error);
        setError(error);
    }, []);

    const clearError = React.useCallback(() => {
        setError(null);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return { handleError, clearError };
}
