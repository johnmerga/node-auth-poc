import { type CustomHelpers, ErrorReport } from "joi";
export const password = (value: string, helpers: CustomHelpers) => {
  if (value.length < 5) {
    return helpers.message({
      custom: "password must be at least 5 characters",
    });
  }
  if (!value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)) {
    return helpers.message({
      custom: "password must contain at least one uppercase letter, one lowercase letter, and one number",
    });
  }
  return value;
};
