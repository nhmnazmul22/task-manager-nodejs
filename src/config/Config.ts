import path from "node:path";
import fs from "node:fs";

export class Config {
  private static instance: Config;
  private readonly envMap: Map<string, string> = new Map<string, string>();

  constructor() {
    this.loadEnv();
  }

  /**
   * Get the instance of the Config (Singleton)
   * @returns Config
   */
  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /**
   * Load environment variables from .env file and store them in a map
   */
  private loadEnv(): void {
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
          this.envMap.set(key.trim(), value.trim());
        }
      });
    } catch (err) {
      console.warn("Could not load .env file:", err);
    }
  }

  /**
   * Get the value of an environment variable by key
   * @param key string
   * @returns string | undefined
   */
  public get(key: string): string | undefined {
    return this.envMap.get(key);
  }

  /**
   * Get the number value of an environment variable by key
   * @param key string
   * @returns string | undefined
   */
  public getNumber(key: string): number | undefined {
    const value = this.get(key);
    if (value) {
      return Number(value);
    }
  }
}
