import { z } from 'zod';

export const CreateCriteriaSchema = z.object({
  trackId: z.string().uuid(),
  name: z.string().min(1).max(255),
  weight: z.number().positive().max(100),
  maxScore: z.number().positive().max(100),
});

export const SubmitScoreSchema = z.object({
  projectId: z.string().uuid(),
  criteriaId: z.string().uuid(),
  assessment: z.number().min(0).max(100),
  comment: z.string().optional(),
});

export const ReportConflictSchema = z.object({
  teamId: z.string().uuid(),
  reason: z.string().optional(),
});

export const UuidParamSchema = z.object({ id: z.string().uuid() });

export type CreateCriteriaDto = z.infer<typeof CreateCriteriaSchema>;
export type SubmitScoreDto = z.infer<typeof SubmitScoreSchema>;
export type ReportConflictDto = z.infer<typeof ReportConflictSchema>;
