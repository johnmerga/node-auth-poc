import express, { type NextFunction, type Request, type Response } from "express";
import httpStatus from "http-status";
import { ApiError } from "./middleware/errors";
import { errorConverter, errorHandler } from "./middleware/errors";
import { morganMiddleware } from "./middleware/logger";
import { authRouter } from "./routes";

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
