import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-200">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                    <h3 className="text-lg font-semibold">Something went wrong</h3>
                    <p className="text-sm text-red-200/70 max-w-xs">
                        {this.state.error?.message || "An unexpected error occurred."}
                    </p>
                    <Button
                        onClick={this.handleReset}
                        variant="outline"
                        className="border-red-500/30 hover:bg-red-500/10 text-red-300"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reload Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
