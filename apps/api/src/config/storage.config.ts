const storageSecret = process.env.STORAGE_SECRET;
const filesystem = (process.env.FILESYSTEM || 'local').toLowerCase();

if (filesystem === 'local' && (!storageSecret || Buffer.byteLength(storageSecret) < 32)) {
  throw new Error(
    'STORAGE_SECRET wajib diisi minimal 32 byte untuk penyimpanan lokal. Generate dengan: openssl rand -hex 32',
  );
}

export default {
  storageSecret: storageSecret || '',
  expiredTime: 60 * 60, // 24
  defaultMaxSize: 15 * 1024 * 1024, // 10MB
  image: {
    types: ['image/png', 'image/jpeg', 'image/jpg'],
    enum: ['image/png', 'image/jpeg', 'image/jpg'] as const,
    size: 15 * 1024 * 1024, // 15MB
  },
  video: {
    types: ['video/mp4'],
    enum: ['video/mp4'] as const,
    size: 50 * 1024 * 1024, // 50MB
  },
  pdf: {
    types: ['application/pdf'],
    enum: ['application/pdf'] as const,
    size: 15 * 1024 * 1024, // 15MB
  },
  ppt: {
    types: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    enum: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'] as const,
    size: 15 * 1024 * 1024, // 15MB
  },
  tempDir: 'tmp',
  localDir: 'storage/public',
  s3: {
    region: process.env.S3_REGION! || 'ap-south-1',
    accessKeyId: process.env.S3_ACCESS,
    secretAccessKey: process.env.S3_SECRET,
    endpoint: process.env.S3_ENDPOINT!,
    publicEndpoint:
      process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || 'http://localhost:9000',
    forcePathStyle: true,
    bucket: process.env.S3_BUCKET!,
  },
};
