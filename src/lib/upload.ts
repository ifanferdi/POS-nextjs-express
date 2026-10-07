import { generatePresignUrlAction } from '@/features/uploads/api';
import { PresignUrlInput, PresignUrlSchema } from '@/features/uploads/schema';
import axios from 'axios';

/** Upload file ke storage lewat presigned URL, kembalikan `key` (imagePath). */
export async function uploadImageToS3(
  file: File,
  folder?: PresignUrlInput['folder'],
): Promise<string> {
  const input: PresignUrlInput = {
    filename: file.name,
    folder,
    fileType: 'image',
    contentType: file.type as PresignUrlInput['contentType'],
    fileSize: file.size,
  };
  PresignUrlSchema.parse(input);

  const presign = await generatePresignUrlAction(input);
  await axios.put(presign.presignUrl, file, { headers: { 'Content-Type': file.type } });

  return presign.key;
}
