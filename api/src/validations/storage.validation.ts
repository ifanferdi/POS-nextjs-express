import config from '@/config/config';
import z from 'zod';
import { NumberSchema, StringSchema } from './base-validation';

const imageConfig = config.storage.image;
const videoConfig = config.storage.video;

const ImageUploadSchema = z.object({
  filename: StringSchema,
  fileType: z.literal('image'),
  contentType: z.enum(imageConfig.enum),
  fileSize: NumberSchema.max(imageConfig.size),
});

const VideoUploadSchema = z.object({
  filename: StringSchema,
  fileType: z.literal('video'),
  contentType: z.enum(videoConfig.enum),
  fileSize: NumberSchema.max(videoConfig.size),
});

export const UploadSchema = z.discriminatedUnion('fileType', [
  ImageUploadSchema,
  VideoUploadSchema,
]);

export type UploadDto = z.infer<typeof UploadSchema>;
