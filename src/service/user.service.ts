import bcrypt from "bcrypt";
import HttpStatus from "http-status";
import type { UserDto, UserEntity, UserResponseDto } from "../dto";
import { ApiError } from "../middleware/errors/api.error";

export class UserService {
  private readonly SALT_ROUNDS = 10;
  private static MEMORY_DB: Record<string, UserEntity> = {};
  async clearDB(): Promise<void> {
    UserService.MEMORY_DB = {};
  }
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async getUserByUsername(username: string): Promise<UserEntity | undefined> {
    return UserService.MEMORY_DB[username];
  }

  async getUserByEmail(email: string): Promise<UserEntity | undefined> {
    return Object.values(UserService.MEMORY_DB).find((user) => user.email === email);
  }

  async createUser(userDto: UserDto): Promise<UserEntity> {
    const existingUserByUsername = UserService.MEMORY_DB[userDto.username];
    if (existingUserByUsername) {
      throw new ApiError(HttpStatus.CONFLICT, "Username already exists");
    }

    const existingUserByEmail = Object.values(UserService.MEMORY_DB).find((user) => user.email === userDto.email);
    if (existingUserByEmail) {
      throw new ApiError(HttpStatus.CONFLICT, "Email already exists");
    }

    const passwordHash = await this.hashPassword(userDto.password);

    const userEntity: UserEntity = {
      username: userDto.username,
      email: userDto.email,
      type: userDto.type || "user",
      passwordHash,
    };

    UserService.MEMORY_DB[userDto.username] = userEntity;
    return userEntity;
  }

  async updateUser(username: string, updates: Partial<UserDto>): Promise<UserEntity> {
    const userEntity = UserService.MEMORY_DB[username];
    if (!userEntity) {
      throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
    }

    const updatedEntity: UserEntity = {
      ...userEntity,
      ...updates,
      passwordHash: updates.password ? await this.hashPassword(updates.password) : userEntity.passwordHash,
    };

    UserService.MEMORY_DB[username] = updatedEntity;
    return updatedEntity;
  }

  async deleteUser(username: string): Promise<void> {
    const userEntity = UserService.MEMORY_DB[username];
    if (!userEntity) {
      throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
    }

    delete UserService.MEMORY_DB[username];
  }

  async validateCredentials(username: string, password: string): Promise<UserEntity> {
    const userEntity = UserService.MEMORY_DB[username];
    if (!userEntity) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    const isValidPassword = await this.verifyPassword(password, userEntity.passwordHash);
    if (!isValidPassword) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    return userEntity;
  }
}
