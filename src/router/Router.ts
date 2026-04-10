import type { IncomingMessage, ServerResponse } from "node:http";
import { Logger } from "../logger/Logger.js";
import type {
  EnhancedResponse,
  HttpMethod,
  ParsedRequest,
  RouteDefinition,
  RouteHandler,
} from "../types/index.js";

export class Router {
  private readonly logger: Logger;
  private readonly routes: RouteDefinition[] = [];

  constructor() {
    this.logger = Logger.getInstance();
  }

  public registerRoute(method: HttpMethod, path: string, handle: RouteHandler) {
    const regexPath = this.pathToRegex(path);
    this.routes.push({ method, path: regexPath, handle });
    this.logger.debug("ROUTE_REGISTER", `${method}: ${path}`);
  }

  private pathToRegex(path: string): RegExp {
    const pattern = path
      .replace(/\//g, "\\/")
      .replace(/:([a-zA-Z]+)/g, "([^/]+)");
    return new RegExp(`^${pattern}$`);
  }

  private parsedBody(req: IncomingMessage) {
    return new Promise((resolve, reject) => {
      let body = "";

      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();

        if (body.length > 1e6) {
          req.destroy();
          reject(new Error("Payload too large"));
        }
      });

      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });

      req.on("error", reject);
    });
  }

  private extractParamNames(path: string): string[] {
    const matches = path.match(/:([a-zA-Z]+)/g);
    return matches ? matches.map((m) => m.slice(1)) : [];
  }

  private extractParams(
    route: RouteDefinition,
    originalPath: string,
    url: string,
  ) {
    const paramNames = this.extractParamNames(originalPath);
    const match = url.match(route.path);
    if (!match) return {};

    return paramNames.reduce(
      (params, name, index) => {
        // @ts-ignore
        params[name] = match[index + 1];
        return params;
      },
      {} as Record<string, string>,
    );
  }

  private parseQuery(searchParams: URLSearchParams) {
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });
    return query;
  }

  private buildResponse(res: ServerResponse): EnhancedResponse {
    let statusCode = 200;

    const enhanced: EnhancedResponse = {
      status(code: number) {
        statusCode = code;
        return enhanced;
      },
      json<T>(data: T) {
        res.writeHead(statusCode, { "content-type": "application/json" });
        res.end(JSON.stringify(data));
      },
      send(data: string) {
        res.writeHead(statusCode, {
          "content-type": "text/plain",
        });
        res.end(JSON.stringify(data));
      },
      setHeader(key: string, value: string) {
        res.setHeader(key, value);
      },
      pipe(stream: NodeJS.ReadableStream) {
        stream.pipe(res);
      },
    };

    return enhanced;
  }

  public async handle(req: IncomingMessage, res: ServerResponse) {
    const method = req.method as HttpMethod;
    const parsedUrl = new URL(req.url || "", `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    this.logger.info("REQUEST", `${method} ${pathname}`);

    const matchRoute = this.routes.find(
      (route) => route.method === method && route.path.test(pathname),
    );

    if (!matchRoute) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: `Cannot ${method} ${pathname}`,
          statusCode: 404,
        }),
      );
      return;
    }

    const body = this.parsedBody(req);
    const params = this.extractParams(matchRoute, pathname, pathname);
    const query = this.parseQuery(parsedUrl.searchParams);

    const parsedRequest: ParsedRequest = {
      method,
      url: pathname,
      params,
      query,
      body,
      headers: req.headers as Record<string, string | string[]>,
    };

    const enhancedResponse = this.buildResponse(res);

    await matchRoute.handle(parsedRequest, enhancedResponse);
  }
}
