import HttpStatus from "http-status";
import type { UserDto } from "../dto/user.dto";
import { ApiError } from "../errors/api.error";

const MEMORY_DB: Record<string, UserDto> = {};

interface UserEntry {
  email: string;
  type: "user" | "admin";
  salt: string;
  passwordhash: string;
}

export class UserService {
  async getUserByUsername(username: string): Promise<UserDto | undefined> {
    return MEMORY_DB[username];
  }

  async getUserByEmail(email: string): Promise<UserDto | undefined> {
    return Object.values(MEMORY_DB).find((user) => user.email === email);
  }

  async createUser(user: UserDto): Promise<UserDto> {
    const existingUserByUsername = await this.getUserByUsername(user.username);
    if (existingUserByUsername) {
      throw new ApiError(HttpStatus.CONFLICT, "Username already exists");
    }

    const existingUserByEmail = await this.getUserByEmail(user.email);
    if (existingUserByEmail) {
      throw new ApiError(HttpStatus.CONFLICT, "Email already exists");
    }

    MEMORY_DB[user.username] = user;
    return user;
  }

  async updateUser(username: string, updates: Partial<UserDto>): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
    }

    MEMORY_DB[username] = { ...user, ...updates };
  }

  async deleteUser(username: string): Promise<void> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
    }
    delete MEMORY_DB[username];
  }
}
