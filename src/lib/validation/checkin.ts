import { z } from "zod";

export const checkinSchema = z.object({
  qrToken: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
}).refine((v) => v.qrToken || v.email, {
  message: "Provide either qrToken or email",
});
