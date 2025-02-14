export interface UserDto {
  username: string;
  email: string;
  password: string;
  type?: "user" | "admin";
}

export interface UserResponseDto {
  username: string;
  email: string;
  type: "user" | "admin";
}

export interface UserEntity {
  username: string;
  email: string;
  type: "user" | "admin";
  passwordHash: string;
}
