import BaseController from '@/adapters/http/controller/_base-controller';
import { IUser } from '@/domain/entities/models/user';
import { extractUserId } from '@/helpers/common.helper';
import {
  ResendOtpSchema,
  SignInAuthSchema,
  TokenSchema,
  VerifyOtpDto,
  VerifyOtpSchema,
} from '@/validations/auth-validation';
import e from 'express';
import asyncHandler from 'express-async-handler';

export default class AuthController extends BaseController {
  signIn = asyncHandler(async (req: e.Request, res: e.Response) => {
    // trust proxy sudah aktif → req.ip = IP klien asli (di belakang Caddy).
    const params = {
      ...SignInAuthSchema.parse({
        username: req.body.username,
        password: req.body.password,
      }),
      ipAddress: req.ip,
    };

    const token = await this.useCases.authUseCase.signIn.execute(params);

    res.json({ message: 'Success', ...token });
  });

  signOut = asyncHandler(async (req: e.Request & Record<string, any>, res: e.Response) => {
    await this.useCases.authUseCase.signOut.execute({
      sessionId: req.user?.sessionId,
    });

    res.json({ message: 'Success' });
  });

  checkToken = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = TokenSchema.parse({
      token: req.headers.authorization?.replace('Bearer ', ''),
    });

    res.json(await this.useCases.authUseCase.checkToken.execute(params));
  });

  refreshToken = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = TokenSchema.parse({ token: req.body.refreshToken });

    const refreshToken = await this.useCases.authUseCase.refreshToken.execute(params);

    res.json({ message: 'Success', ...refreshToken });
  });

  resendOtp = asyncHandler(async (req: e.Request, res: e.Response) => {
    const { userId } = ResendOtpSchema.parse({ userId: extractUserId(req) });

    const user = (await this.useCases.userUseCase.findByIdUser.execute({
      id: userId,
    })) as IUser;

    await this.useCases.authUseCase.sendOtp.execute(user, true);

    res.json({ message: 'Success' });
  });

  verifyOTP = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: VerifyOtpDto = VerifyOtpSchema.parse({
      otp: req.body.otp,
      userId: req.body.userId,
      challengeId: req.body.challengeId,
    });

    const verified = await this.useCases.authUseCase.verifyOtp.execute(params);

    res.json({ message: 'Success', ...verified });
  });
}
