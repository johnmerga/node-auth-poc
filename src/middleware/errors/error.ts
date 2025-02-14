import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../config/config";
import { Logger } from "../../middleware/logger";
import { ApiError } from "./api.error";

// Helper function to safely get status name
const getStatusName = (code: number): string => {
  const key = `${code}_NAME` as keyof typeof httpStatus;
  return (httpStatus[key] as string) || "Internal Server Error";
};

export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode: number = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message: string = error.message || getStatusName(statusCode);
    error = new ApiError(statusCode, message, false, error.stack);
  }
  next(error);
};

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;
  if (config.env === "production" && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = getStatusName(statusCode);
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  };

  if (config.env === "development") {
    Logger.error(err);
  }

  res.status(statusCode).send({
    error: response,
  });
};
