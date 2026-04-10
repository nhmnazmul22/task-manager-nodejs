export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export type LogEntry = {
  timestamp: Date;
  level: LogLevel;
  event: string;
  description: string;
};
