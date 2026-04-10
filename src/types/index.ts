import type { IncomingMessage, ServerResponse } from "node:http";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type LogEntry = {
  timestamp: Date;
  level: LogLevel;
  event: string;
  description: string;
};

export interface RouteDefinition {
  method: string;
  path: RegExp;
  handle: RouteHandler;
}

export type RouteHandler = (
  req: ParsedRequest,
  res: EnhancedResponse,
) => Promise<void>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface ParsedRequest {
  method: HttpMethod;
  url: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export interface EnhancedResponse {
  json: <T>(data: ApiResponse<T>) => void;
  status: (code: number) => EnhancedResponse;
  send: (data: string) => void;
  setHeader: (key: string, value: string) => void;
  pipe: (stream: NodeJS.ReadableStream) => void;
}
