import { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { login, logout, register } from "../validator/auth.validator";

export class AuthRouter {
  private authController: AuthController;
  public router: Router;
  constructor() {
    this.router = Router();
    this.authController = new AuthController();
  }
  public routes() {
    this.router.route("/register").post(validate(register), this.authController.register);
    this.router.route("/login").post(validate(login), this.authController.login);
    this.router.route("/logout").post(validate(logout), this.authController.logout);
    // this.router.route("/refresh-token").post(validate(authValidator.refreshTokens), this.authController.refreshToken);
    return this.router;
  }
}
