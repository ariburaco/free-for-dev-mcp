import { z } from 'zod';

export const ServiceCategorySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  services: z.array(z.object({
    name: z.string(),
    url: z.string(),
    description: z.string(),
    freeTier: z.string(),
    limitations: z.string().optional(),
    tags: z.array(z.string()).optional()
  }))
});

export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export interface Service {
  name: string;
  url: string;
  description: string;
  freeTier: string;
  category: string;
  limitations?: string;
  tags?: string[];
}

export interface ParsedContent {
  categories: ServiceCategory[];
  services: Service[];
  lastUpdated: Date;
}

export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().default(10)
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export const ListCategoriesParamsSchema = z.object({
  withCount: z.boolean().default(false)
});

export type ListCategoriesParams = z.infer<typeof ListCategoriesParamsSchema>;

export const GetServiceParamsSchema = z.object({
  name: z.string().optional(),
  url: z.string().optional()
});

export type GetServiceParams = z.infer<typeof GetServiceParamsSchema>;