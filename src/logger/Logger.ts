import path from "path";
import * as fs from "fs";
import type { LogEntry, LogLevel } from "../types/index.js";

export class Logger {
  private static instance: Logger;
  private readonly logStream: NodeJS.WritableStream;
  private readonly logDir: string;

  /**
   * get the log directory and create a write stream for the log file
   */
  private constructor() {
    this.logDir = path.resolve(process.cwd(), "data", "logs");
    this.ensureLogDir(); // Checking directory exist or not and create if not exist
    this.logStream = fs.createWriteStream(path.join(this.logDir, "app.log"), {
      flags: "a",
    });
  }

  /**
   * Get the instance of the Logger (Singleton)
   * @returns Logger
   */

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Ensure that the log directory exists, if not create it
   * @returns void
   */

  private ensureLogDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Write a log entry to the log file and console
   * @param level LogLevel
   * @param event string
   * @param description string
   */

  private write(level: LogLevel, event: string, description: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      event,
      description,
    };

    // Write the log entry to the file
    this.logStream.write(JSON.stringify(logEntry) + "\n");

    // Show the log entry in the console
    const colors = {
      INFO: "\x1b[36m",
      ERROR: "\x1b[31m",
      WARN: "\x1b[33m",
      DEBUG: "\x1b[35m",
    };

    console.log(`${colors[level]}[${level}]\x1b[0m ${event}: ${description}]`);
  }

  /**
   * Log an info message
   * @param event string
   * @param description string
   * @returns void
   */
  public info(event: string, description: string): void {
    this.write("INFO", event, description);
  }

  /**
   * Log an error message
   * @param event string
   * @param description string
   * @returns void
   */
  public error(event: string, description: string): void {
    this.write("ERROR", event, description);
  }

  /**
   * Log an error message
   * @param event string
   * @param description string
   * @returns void
   */
  public warn(event: string, description: string): void {
    this.write("WARN", event, description);
  }

  /**
   * Log a debug message
   * @param event string
   * @param description string
   * @returns void
   */
  public debug(event: string, description: string): void {
    this.write("DEBUG", event, description);
  }

  /**
   * Close the log stream when the application is shutting down
   */
  public close(): void {
    this.logStream.end();
  }
}
