import { files } from '@/config/config';
import { numberSchema, stringSchema } from '@/lib/base.schema';
import { z } from 'zod';

export const PresignUrlSchema = z.object({
  filename: stringSchema,
  fileType: z.literal('image'),
  contentType: z.enum(files.image.enum),
  fileSize: numberSchema.max(files.image.size),
});

export const ImageFileSchema = z
  .custom<FileList>((value): value is FileList => value instanceof FileList)
  .optional()
  .refine(
    (list) => !list || list.length === 0 || files.image.types.includes(list[0]?.type ?? ''),
    'Only PNG or JPG images are allowed.',
  )
  .refine(
    (list) => !list || list.length === 0 || (list[0]?.size ?? 0) <= files.image.size,
    'Image must be smaller than 15 MB.',
  );

export const PresignUrlResponseSchema = z.object({
  key: stringSchema,
  presignUrl: stringSchema,
  expiresIn: numberSchema,
});

export type PresignUrlInput = z.infer<typeof PresignUrlSchema>;
export type PresignUrlResponse = z.infer<typeof PresignUrlResponseSchema>;
