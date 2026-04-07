
/**
 * Centralized error logging utility for ERICA 3.0.
 * In a production environment, this could send logs to a service like Sentry or LogRocket.
 */

export enum ErrorSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

interface ErrorContext {
    component?: string;
    hook?: string;
    action?: string;
    [key: string]: any;
}

export const logError = (error: unknown, severity: ErrorSeverity = ErrorSeverity.MEDIUM, context: ErrorContext = {}) => {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logPayload = {
        timestamp,
        severity,
        message: errorMessage,
        stack: errorStack,
        context,
    };

    // Log to console for development
    console.group(`[ERICA ERROR] ${severity}: ${errorMessage}`);
    console.log('Timestamp:', timestamp);
    console.log('Context:', context);
    if (errorStack) {
        console.log('Stack Trace:', errorStack);
    }
    console.groupEnd();

    // In a real app, you'd send this to your logging backend here
    // e.g., fetch('/api/logs', { method: 'POST', body: JSON.stringify(logPayload) });
};

export const getFriendlyErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('api key')) {
            return "There's an issue with the API configuration. Please contact support or check your environment settings.";
        }
        
        if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
            return "Network error. Please check your internet connection and try again.";
        }

        if (message.includes('quota') || message.includes('rate limit') || message.includes('429')) {
            return "We're receiving too many requests right now. Please wait a moment and try again.";
        }

        if (message.includes('permission') || message.includes('notallowed')) {
            return "Permission denied. Please ensure you've granted the necessary access (camera/microphone).";
        }

        if (message.includes('not found') || message.includes('404')) {
            return "The requested resource could not be found.";
        }

        if (message.includes('timeout')) {
            return "The request timed out. The server might be busy, please try again.";
        }
    }

    return "An unexpected error occurred. Our team has been notified.";
};
