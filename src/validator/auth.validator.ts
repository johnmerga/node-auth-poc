import joi from "joi";
import type { UserDto } from "../dto";
import { password } from "./custom.validator";

const registerBody: Record<keyof UserDto, any> = {
  username: joi
    .string()
    .min(3)
    .max(24)
    .required()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      "string.pattern.base": "Username must contain only letters, numbers, underscores, and hyphens",
    }),
  email: joi.string().email().required(),
  type: joi.string().valid("user", "admin").required(),
  password: joi.string().required().custom(password),
};

export const register = {
  body: joi.object().keys(registerBody),
};

export const login = {
  body: joi.object().keys({
    username: registerBody.username,
    password: joi.string().required(),
  }),
};

export const logout = {
  body: joi.object().keys({
    refreshToken: joi.string().required(),
  }),
};

export const refreshTokens = {
  body: joi.object().keys({
    refreshToken: joi.string().required().trim(),
  }),
};
