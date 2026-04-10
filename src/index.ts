import { Server } from "./server/Server.js";
import { Config } from "./config/Config.js";
import { Router } from "./router/Router.js";

const config = Config.getInstance();
const router = new Router();
const port = config.getNumber("PORT", 3000);

const server = new Server(router, port);
server.start();
