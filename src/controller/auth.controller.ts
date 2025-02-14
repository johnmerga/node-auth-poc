import type { Request, Response } from "express";
import httpStatus from "http-status";
import { Logger } from "../logger";
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

  public register = catchAsync(async (req: Request, res: Response) => {
    const user = await this.userService.createUser(req.body);
    const tokens = await this.tokenService.generateAccessAndRefreshToken(user);
    res.status(httpStatus.CREATED).send({ user, tokens });
  });

  public login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await this.authService.loginWithEmailAndPassword(email, password);
    const tokens = await this.tokenService.generateAccessAndRefreshToken(user);
    res.status(httpStatus.OK).send({ user, tokens });
  });

  public logout = catchAsync(async (req: Request, res: Response) => {
    await this.authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
  });

  public refreshToken = catchAsync(async (req: Request, res: Response) => {
    const userWithTokens = await this.authService.refreshAuth(req.body.refreshToken);
    res.send(userWithTokens);
  });
}
