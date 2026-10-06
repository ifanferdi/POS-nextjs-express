import config from '@/config/config';
import { UploadEntity } from '@/domain/entities/types/storage.types';
import z from 'zod';
import { NumberSchema, StringSchema } from './base-validation';

const imageConfig = config.storage.image;
const videoConfig = config.storage.video;

const BaseUploadSchema = {
  filename: StringSchema.min(1, 'Filename cannot be empty.'),
  folder: z.nativeEnum(UploadEntity).optional(),
};

const ImageUploadSchema = z.object({
  ...BaseUploadSchema,
  fileType: z.literal('image'),
  contentType: z.enum(imageConfig.enum),
  fileSize: NumberSchema.max(imageConfig.size),
});

const VideoUploadSchema = z.object({
  ...BaseUploadSchema,
  fileType: z.literal('video'),
  contentType: z.enum(videoConfig.enum),
  fileSize: NumberSchema.max(videoConfig.size),
});

export const UploadSchema = z.discriminatedUnion('fileType', [
  ImageUploadSchema,
  VideoUploadSchema,
]);

export type UploadDto = z.infer<typeof UploadSchema>;
