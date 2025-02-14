import bcrypt from "bcryptjs";
import type { UserDto } from "../dto/user.dto";
import { ApiError } from "../errors/api.error";
import { TokenService } from "./token.service";
import { UserService } from "./user.service";

export class AuthService {
  private userService: UserService;
  private tokenService: TokenService;

  constructor() {
    this.userService = new UserService();
    this.tokenService = new TokenService();
  }

  async loginWithEmailAndPassword(email: string, password: string): Promise<UserDto> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(401, "Incorrect email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Incorrect email or password");
    }

    return user;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.deleteToken(refreshToken);
  }

  async refreshAuth(refreshToken: string): Promise<{ user: UserDto; tokens: any }> {
    const payload = this.tokenService.verifyToken(refreshToken);
    const user = await this.userService.getUserByUsername(payload.sub);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    await this.tokenService.deleteToken(refreshToken);
    const tokens = await this.tokenService.generateAccessAndRefreshToken(user);

    return {
      user,
      tokens,
    };
  }
}
