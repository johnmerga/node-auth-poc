import { app } from "./app";
import config from "./config/config";
import { Logger } from "./middleware/logger/";

import events from "events";
import http from "http";

const server = http.createServer(app);

const workflow = new events.EventEmitter();

workflow.on("startServer", () => {
  server.listen(config.port, () => {
    Logger.info(`Server is running on port ${config.port}`);
    // list all routes
    Logger.info("/auth/register - POST - Register a new user");
    Logger.info("/auth/login - POST - Login");
  });
});
/* Other Pre-start workflow steps can be added here. */

workflow.emit("startServer");

process.on("SIGINT", (code) => {
  Logger.info(`Server is shutting down with code: ${code}`);
  server.close();
  process.exit(0);
});
