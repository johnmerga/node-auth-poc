import HttpStatus from "http-status";
import type { UserEntity } from "../dto";
import { ApiError } from "../middleware/errors/api.error";
import { TokenService } from "./token.service";
import { UserService } from "./user.service";

export interface TokenPayload {
  sub: string; // username
  type: "user" | "admin";
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  access: {
    token: string;
    expires: Date;
  };
  refresh: {
    token: string;
    expires: Date;
  };
}

export class AuthService {
  private userService: UserService;
  private tokenService: TokenService;

  constructor() {
    this.userService = new UserService();
    this.tokenService = new TokenService();
  }

  async loginWithEmailAndPassword(username: string, password: string): Promise<UserEntity> {
    const user = await this.userService.getUserByUsername(username);
    if (!user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Incorrect email or password");
    }

    const isPasswordValid = await this.userService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, "Incorrect email or password");
    }

    return user;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.deleteToken(refreshToken);
  }

  async refreshAuth(refreshToken: string): Promise<{ user: UserEntity; tokens: AuthTokens }> {
    const payload = this.tokenService.verifyToken(refreshToken) as TokenPayload;

    const user = await this.userService.getUserByUsername(payload.sub);
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
    }

    await this.tokenService.deleteToken(refreshToken);
    const tokens = await this.tokenService.generateAccessAndRefreshToken(user);

    return {
      user,
      tokens,
    };
  }
}
