import express, { Express, NextFunction, Request, Response } from "express";
import { errorConverter, errorHandler } from "./errors/error";
import { morganMiddleware } from "./logger";
import { authRouter } from "./routes";
import { ApiError } from "./errors/api.error";
import httpStatus from "http-status";

const app = express();
// Middleware to parse JSON bodies
app.use(express.json());
app.use(morganMiddleware);

app.use("/auth", authRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, "unknown route"));
});
app.use(errorConverter);
app.use(errorHandler);

export { app };
