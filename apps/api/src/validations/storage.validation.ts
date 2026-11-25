import config from '@/config/config';
import { UploadEntity } from '@/domain/entities/types/storage.types';
import z from 'zod';
import { NumberSchema, StringSchema, Trimmed } from './base-validation';

const imageConfig = config.storage.image;
const videoConfig = config.storage.video;

const BaseUploadSchema = {
  filename: StringSchema.min(1, 'Filename cannot be empty.'),
  folder: Trimmed(z.nativeEnum(UploadEntity)),
};

const ImageUploadSchema = z.object({
  ...BaseUploadSchema,
  fileType: z.literal('image'),
  contentType: Trimmed(z.enum(imageConfig.enum)),
  fileSize: NumberSchema.max(imageConfig.size),
});

const VideoUploadSchema = z.object({
  ...BaseUploadSchema,
  fileType: z.literal('video'),
  contentType: Trimmed(z.enum(videoConfig.enum)),
  fileSize: NumberSchema.max(videoConfig.size),
});

export const UploadSchema = z.preprocess(
  (value) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const payload = value as Record<string, unknown>;
      if (typeof payload.fileType === 'string') {
        return { ...payload, fileType: payload.fileType.trim() };
      }
    }
    return value;
  },
  z.discriminatedUnion('fileType', [ImageUploadSchema, VideoUploadSchema]),
);

export type UploadDto = z.infer<typeof UploadSchema>;
