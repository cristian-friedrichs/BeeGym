export interface LogEntry {
    id: string;
    timestamp: string;
    action: string;
    resource?: string;
    details?: any;
    metadata?: any;
    user?: string;
    origin?: string;
    entity?: string;
    entityId?: string;
    description?: string;
}

type LogActionInput = Omit<LogEntry, 'id' | 'timestamp'>;

export function logAction(data: LogActionInput) {
    if (typeof window === 'undefined') {
        return; // Avoid running on server
    }

    try {
        const newLog: LogEntry = {
            ...data,
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date().toISOString(),
        };

        const existingLogsJSON = localStorage.getItem('system_logs');
        const existingLogs: LogEntry[] = existingLogsJSON ? JSON.parse(existingLogsJSON) : [];

        const updatedLogs = [newLog, ...existingLogs];

        localStorage.setItem('system_logs', JSON.stringify(updatedLogs));

    } catch (error) {
        console.error("Failed to write log to localStorage:", error);
    }
}
