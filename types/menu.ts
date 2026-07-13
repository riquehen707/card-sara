import { z } from "zod";

export const establishmentSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  description: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().min(1),
  hours: z.string().min(1),
  instagram: z.string().url().optional(),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().optional(),
  description: z.string().optional(),
});

export const productAccompanimentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  included: z.boolean().optional(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().min(1),
  order: z.number().optional(),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  price: z.number().nonnegative().nullable(),
  promotionalPrice: z.number().nonnegative().optional(),
  portion: z.string().min(1),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1),
  available: z.boolean(),
  isNew: z.boolean().optional(),
  isPromotional: z.boolean().optional(),
  accompaniments: z.array(productAccompanimentSchema).optional(),
  notes: z.string().optional(),
});

export const menuDataSchema = z.object({
  establishment: establishmentSchema,
  categories: z.array(categorySchema).min(1),
  products: z.array(productSchema).min(1),
});

export type Establishment = z.infer<typeof establishmentSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ProductAccompaniment = z.infer<
  typeof productAccompanimentSchema
>;
export type Product = z.infer<typeof productSchema>;
export type MenuData = z.infer<typeof menuDataSchema>;
