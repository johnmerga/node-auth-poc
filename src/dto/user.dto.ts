export interface UserDto {
  username: string;
  email: string;
  type: "user" | "admin";
  password: string;
}
