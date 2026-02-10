import { z } from 'zod';

export const ProfileSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "格式: YYYY-MM-DD"),
  birthTime: z.string().optional().or(z.literal('')),
  birthTimePrecision: z.enum(['exact_shichen', 'approx_range', 'unknown']).default('unknown'),
  birthShichen: z.string().optional().or(z.literal('')),
  birthTimeRange: z.string().optional().or(z.literal('')),
  birthPlace: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']),
  focus: z.enum(['wealth', 'love', 'career']),
  mbti: z.string().optional().or(z.literal('')),
  bloodType: z.string().optional().or(z.literal('')),
});

export type ProfileData = z.infer<typeof ProfileSchema>;
