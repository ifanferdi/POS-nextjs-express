const requiredEnv = (name: 'S3_REGION' | 'S3_BUCKET') => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const region = requiredEnv('S3_REGION');
const bucket = requiredEnv('S3_BUCKET');
const accessKeyId = process.env.S3_ACCESS;
const secretAccessKey = process.env.S3_SECRET;

if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
  throw new Error('S3_ACCESS and S3_SECRET must be configured together.');
}

export default {
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
  s3: {
    region,
    accessKeyId,
    secretAccessKey,
    endpoint: process.env.S3_ENDPOINT || undefined,
    publicEndpoint:
      process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT || undefined,
    forcePathStyle: true,
    bucket,
  },
};
