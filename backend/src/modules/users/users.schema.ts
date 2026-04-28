import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/i).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const AddSocialSchema = z.object({
  typeSocial: z.enum(['discord', 'telegram', 'viber', 'github']),
  url: z.string().url(),
});

export const UuidParamSchema = z.object({
  id: z.string().uuid(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type AddSocialDto = z.infer<typeof AddSocialSchema>;
