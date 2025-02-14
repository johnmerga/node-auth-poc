import type { Request, Response } from "express";
import httpStatus from "http-status";
import type { UserEntity, UserResponseDto } from "../dto";
import { AuthService } from "../service/auth.service";
import { TokenService } from "../service/token.service";
import { UserService } from "../service/user.service";
import { catchAsync } from "../utils/catchAsync";

export class AuthController {
  private authService: AuthService;
  private userService: UserService;
  private tokenService: TokenService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
    this.tokenService = new TokenService();
  }

  private mapToUserResponse(user: UserEntity): UserResponseDto {
    const { passwordHash, ...userResponse } = user;
    return userResponse;
  }

  public register = catchAsync(async (req: Request, res: Response) => {
    const userEntity = await this.userService.createUser(req.body);
    const tokens = await this.tokenService.generateAccessAndRefreshToken(userEntity);
    res.status(httpStatus.CREATED).send({
      user: this.mapToUserResponse(userEntity),
      tokens,
    });
  });

  public login = catchAsync(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const userEntity = await this.authService.loginWithEmailAndPassword(username, password);
    const tokens = await this.tokenService.generateAccessAndRefreshToken(userEntity);
    res.status(httpStatus.OK).send({
      user: this.mapToUserResponse(userEntity),
      tokens,
    });
  });

  public logout = catchAsync(async (req: Request, res: Response) => {
    await this.authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
  });

  public refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { user: userEntity, tokens } = await this.authService.refreshAuth(req.body.refreshToken);
    res.send({
      user: this.mapToUserResponse(userEntity),
      tokens,
    });
  });
}
