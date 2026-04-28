import { z } from 'zod';

export const CreateAvailabilitySchema = z.object({
  trackId: z.string().uuid().optional(),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime(),
});

export const BookSlotSchema = z.object({
  mentorAvailabilityId: z.string().uuid(),
  startDatetime: z.string().datetime(),
  durationMinute: z.number().int().min(15).max(120),
  teamId: z.string().uuid(),
  meetingLink: z.string().url().optional(),
});

export const UpdateSlotStatusSchema = z.object({
  status: z.enum(['booked', 'completed', 'cancelled']),
});

export const UuidParamSchema = z.object({ id: z.string().uuid() });

export type CreateAvailabilityDto = z.infer<typeof CreateAvailabilitySchema>;
export type BookSlotDto = z.infer<typeof BookSlotSchema>;
export type UpdateSlotStatusDto = z.infer<typeof UpdateSlotStatusSchema>;
