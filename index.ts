const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const app = express();
const port = 3000;

import { NextFunction, Request, Response } from "express";

// Middleware to parse JSON bodies
app.use(express.json());

interface UserDto {
  username: string;
  email: string;
  type: "user" | "admin";
  password: string;
}

interface UserEntry {
  email: string;
  type: "user" | "admin";
  salt: string;
  passwordhash: string;
}

// Define strong types for the memory database
const MEMORY_DB: Record<string, UserEntry> = {};

// Validation schema using Joi
const userSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(24)
    .required()
    .pattern(/^[a-zA-Z0-9_-]+$/) // Allow alphanumeric, underscore, and hyphen
    .messages({
      "string.pattern.base":
        "Username must contain only letters, numbers, underscores, and hyphens",
    }),
  email: Joi.string().email().required(),
  type: Joi.string().valid("user", "admin").required(),
  password: Joi.string()
    .min(5)
    .max(24)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one special character",
    }),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

// Helper functions with proper type safety
function getUserByUsername(name: string): UserEntry | undefined {
  return MEMORY_DB[name];
}

function getUserByEmail(email: string): UserEntry | undefined {
  return Object.values(MEMORY_DB).find((user) => user.email === email);
}

// Error handling middleware
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: Function,
) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
};

app.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const { error, value } = userSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: "Validation Error",
          details: error.details[0].message,
        });
      }

      const { username, email, type, password } = value;

      // Check for existing user
      if (getUserByUsername(username)) {
        return res.status(409).json({
          error: "Conflict",
          message: "Username already exists",
        });
      }

      if (getUserByEmail(email)) {
        return res.status(409).json({
          error: "Conflict",
          message: "Email already registered",
        });
      }

      // Generate salt and hash password
      const salt = await bcrypt.genSalt(12); // Higher rounds for better security
      const passwordhash = await bcrypt.hash(password, salt);

      // Store user in memory database
      MEMORY_DB[username] = {
        email,
        type,
        salt,
        passwordhash,
      };

      // Return success without exposing sensitive data
      res.status(201).json({
        message: "User registered successfully",
        username,
        email,
        type,
      });
    } catch (err) {
      next(err);
    }
  },
);

app.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation Error",
        details: error.details[0].message,
      });
    }

    const { username, password } = value;

    // Get user from database( for simplicity, we are using in-memory database)
    const user = getUserByUsername(username);
    if (!user) {
      // Use vague message for security
      return res.status(401).json({
        error: "Authentication failed",
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordhash);
    if (!isValid) {
      // Use vague message for security
      return res.status(401).json({
        error: "Authentication failed",
      });
    }

    // Return success without exposing sensitive data
    res.status(200).json({
      message: "Login successful",
      username,
      email: user.email,
      type: user.type,
    });
  } catch (err) {
    next(err);
  }
});

//error handling middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
export { app, MEMORY_DB };
