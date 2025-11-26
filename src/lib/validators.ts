import { z } from 'zod';

// username validation schema: 4-100 characters
export const usernameSchema = z.string()
  .min(4, "Username must be at least 4 characters.")
  .max(100, "Username must not exceed 100 characters.")
  .trim();

// password validation schema: minimum 4 characters
export const passwordSchema = z.string()
  .min(4, "Password must be at least 4 characters.");

// login form schema
export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

// sign up form schema with password confirmation
export const signUpSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})