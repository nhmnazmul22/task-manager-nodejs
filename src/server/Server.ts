import http, { IncomingMessage, ServerResponse } from "http";
import { Config } from "../config/Config.js";
import { Logger } from "../logger/Logger.js";
import type { Router } from "../router/Router.js";

export class Server {
  private httpServer: http.Server;
  private config: Config;
  private logger: Logger;

  constructor(
    private readonly route: Router,
    private readonly port: number,
  ) {
    this.config = Config.getInstance();
    this.logger = Logger.getInstance();
    this.httpServer = this.createServer();
  }

  private createServer(): http.Server {
    return http.createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        // CORS Headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
        );

        // handle preflight requests
        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        try {
          this.route.handle(req, res);
        } catch (err) {
          this.handleServerError(err, res);
        }
      },
    );
  }

  private handleServerError(err: any, res: ServerResponse): void {
    this.logger.error("SERVER_ERROR", String(err));
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Internal Server Error",
          status: 500,
        }),
      );
    }
  }

  private setupGracefulShutdown(): void {
    process.on("SIGTERM", () => {
      this.logger.warn("SHUTDOWN", "SIGTERM received, closing server...");
      this.stop();
    });

    process.on("SIGINT", () => {
      this.logger.warn("SHUTDOWN", "SIGINT received, closing server...");
      this.stop();
    });

    // catch unhandled errors — never crash silently
    process.on("uncaughtException", (error: Error) => {
      this.logger.error("UNCAUGHT_EXCEPTION", error.message);
      this.stop();
    });

    process.on("unhandledRejection", (reason: unknown) => {
      this.logger.error("UNHANDLED_REJECTION", String(reason));
    });
  }

  public start(): void {
    this.setupGracefulShutdown();
    this.httpServer.listen(this.port, () => {
      this.logger.info(
        "SERVER_STARTED",
        `Server is running on port ${this.port}`,
      );
    });
  }

  public stop(): void {
    this.httpServer.close(() => {
      this.logger.info("SERVER_STOP", "Server has been stopped");
      this.logger.close();
    });
  }
}
