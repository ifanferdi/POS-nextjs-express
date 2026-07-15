import express from 'express';
import AuthController from '../controller/auth-controller';

export default function AuthRoutes(controller: AuthController) {
  const route = express.Router();

  route.post('/sign-in', controller.signIn);
  route.post('/sign-out', controller.signOut);
  route.post('/refresh-token', controller.refreshToken);
  route.post('/verify-otp', controller.verifyOTP);
  route.post('/resend-otp', controller.resendOtp);

  return route;
}
