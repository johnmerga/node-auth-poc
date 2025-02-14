import morgan, { type StreamOptions } from "morgan";

import Logger from "./logger";

// Override the stream method by telling
// Morgan to use our custom logger instead of the console.log.
const stream: StreamOptions = {
  // Use the http severity
  write: (message) => Logger.http(message),
};

/**
 * If the environment variable NODE_ENV is not set to development, then skip the test
 * @returns A function that returns a boolean.
 */
const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

// Build the morgan middleware
const morganMiddleware = morgan(":method :url :status :res[content-length] - :response-time ms", { stream, skip });
export default morganMiddleware;
