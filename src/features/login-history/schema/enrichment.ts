import { z } from 'zod';

export const userAgentBrandSchema = z.object({
  brand: z.string(),
  version: z.string(),
});

export const clientEnrichmentSchema = z.object({
  os: z.string().min(1),
  browser: z.string().min(1),
  architecture: z.string().min(1),
  physicalWidth: z.number().int().nonnegative(),
  physicalHeight: z.number().int().nonnegative(),
  logicalWidth: z.number().int().nonnegative(),
  logicalHeight: z.number().int().nonnegative(),
  hardwareConcurrency: z.number().int().nonnegative(),
  deviceMemoryGb: z.number().nonnegative().nullable(),
  maxTouchPoints: z.number().int().nonnegative(),
  userAgent: z.string(),
  uaPlatform: z.string().nullable(),
  uaMobile: z.boolean().nullable(),
  uaBrands: z.array(userAgentBrandSchema).nullable(),
});

export type ClientEnrichment = z.infer<typeof clientEnrichmentSchema>;
