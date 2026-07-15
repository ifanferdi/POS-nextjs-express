export default {
  storageSecret: process.env.STORAGE_SECRET || '',
  expiredTime: 60 * 60, // 24 jam
  maxSize: 15 * 1024 * 1024, // 10MB
  acceptedImageTypes: ['image/png', 'image/jpeg', 'image/jpg'],
  acceptedVideoTypes: ['video/mp4'],
  acceptedPdfTypes: ['application/pdf'],
  acceptedPptTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  tempDir: 'tmp',
  localDir: 'storage/public',
  s3: {
    region: process.env.S3_REGION! || 'ap-south-1',
    accessKeyId: process.env.S3_ACCESS,
    secretAccessKey: process.env.S3_SECRET,
    endpoint: process.env.S3_ENDPOINT!,
    forcePathStyle: true,
    bucket: process.env.S3_BUCKET!,
  },
};