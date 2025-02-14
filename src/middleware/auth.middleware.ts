import type { NextFunction, Request, Response } from "express";
import HttpStatus from 'http-status';
import { verify } from "jsonwebtoken";
import config from "../config/config";
import { ApiError } from "../errors/api.error";

export const authenticateMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.header("Authorization")!.replace("Bearer ", "");
    const decoded = verify(token, config.jwt.secret);
    if (!decoded || typeof decoded.sub !== "string") {
      throw new ApiError(HttpStatus.BAD_REQUEST, "bad user");
    }
    const user = 
    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Please authenticate.");
    }
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(HttpStatus.UNAUTHORIZED, "Please authenticate."));
  }
};
