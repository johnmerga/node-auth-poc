import jwt, { type JwtPayload } from "jsonwebtoken";
import moment from "moment";
import config from "../config/config";
import type { UserDto, UserResponseDto } from "../dto/user.dto";
import { ApiError } from "../middleware/errors/api.error";

interface TokenPayload extends JwtPayload {
  sub: string;
  roles: string[];
  type: string;
  exp: number;
  iat: number;
}

interface AccessAndRefreshTokens {
  access: {
    token: string;
    expires: Date;
  };
  refresh: {
    token: string;
    expires: Date;
  };
}

const TOKEN_STORE: Record<string, TokenPayload> = {};

export class TokenService {
  generateToken(payload: TokenPayload, secret: string = config.jwt.secret): string {
    const tokenPayload: TokenPayload = {
      ...payload,
      exp: moment(payload.exp).unix(),
      iat: moment().unix(),
    };
    const token = jwt.sign(tokenPayload, secret);
    TOKEN_STORE[token] = tokenPayload;
    return token;
  }

  verifyToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;
      if (!TOKEN_STORE[token]) {
        throw new ApiError(401, "Token not found");
      }
      return payload;
    } catch (error) {
      throw new ApiError(401, "Invalid token");
    }
  }

  async generateAccessAndRefreshToken(user: UserResponseDto): Promise<AccessAndRefreshTokens> {
    const accessPayload: TokenPayload = {
      sub: user.username,
      roles: [user.type],
      type: "access",
      exp: moment().add(config.jwt.accessExpirationMinutes, "minutes").unix(),
      iat: moment().unix(),
    };

    const refreshPayload: TokenPayload = {
      sub: user.username,
      roles: [user.type],
      type: "refresh",
      exp: moment().add(config.jwt.refreshExpirationDays, "days").unix(),
      iat: moment().unix(),
    };

    const accessToken = this.generateToken(accessPayload);
    const refreshToken = this.generateToken(refreshPayload);

    return {
      access: {
        token: accessToken,
        expires: moment(accessPayload.exp * 1000).toDate(),
      },
      refresh: {
        token: refreshToken,
        expires: moment(refreshPayload.exp * 1000).toDate(),
      },
    };
  }

  async deleteToken(token: string): Promise<void> {
    if (!TOKEN_STORE[token]) {
      throw new ApiError(404, "Token not found");
    }
    delete TOKEN_STORE[token];
  }
}
