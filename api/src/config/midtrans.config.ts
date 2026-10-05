const isProduction =
  process.env.APP_ENV.toLowerCase() === 'production' &&
  process.env.MIDTRANS_IS_PRODUCTION?.toLowerCase() === 'true';

export default {
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  isProduction,
  expiryMinutes: Number(process.env.MIDTRANS_EXPIRY_MINUTES) || 60,
  baseUrl: isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com',
};
