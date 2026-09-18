import { z } from "zod";

export const loginSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("participant"),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
  }),
  z.object({
    role: z.literal("admin"),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
  }),
  z.object({
    role: z.literal("jury"),
    email: z.string().trim().min(1, "Username is required."),
    password: z.string().optional().default(""),
  }),
  z.object({
    role: z.literal("volunteer"),
    email: z.string().trim().min(1, "Passcode is required."),
    password: z.string().optional().default(""),
  }),
]);

export type LoginInput = z.infer<typeof loginSchema>;

