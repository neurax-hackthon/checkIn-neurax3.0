import { z } from "zod";

export const roomInputSchema = z.object({
  room_code: z.string().trim().min(1).max(40),
  display_name: z.string().trim().min(1).max(120),
  building: z.string().trim().max(120).nullable().optional(),
  floor: z.string().trim().max(40).nullable().optional(),
  row_count: z.coerce.number().int().min(1).max(200),
  column_count: z.coerce.number().int().min(1).max(200),
  is_active: z.boolean().optional().default(true),
});
export type RoomInput = z.infer<typeof roomInputSchema>;

export const teamInputSchema = z.object({
  team_code: z.string().trim().min(1).max(40),
  team_name: z.string().trim().max(120).nullable().optional(),
  theme: z.string().trim().max(120).nullable().optional(),
  room_id: z.string().uuid().nullable().optional(),
  bench_id: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});
export type TeamInput = z.infer<typeof teamInputSchema>;

export const participantInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(40).nullable().optional(),
  college: z.string().trim().max(200).nullable().optional(),
  team_id: z.string().uuid().nullable().optional(),
  is_team_leader: z.boolean().optional().default(false),
  status: z.enum(["active", "disabled", "review"]).optional().default("active"),
});
export type ParticipantInput = z.infer<typeof participantInputSchema>;

export const MAX_TEAM_SIZE_DEFAULT = 4;
export const MIN_TEAM_SIZE_DEFAULT = 3;
