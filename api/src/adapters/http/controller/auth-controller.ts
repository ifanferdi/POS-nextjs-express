import e from 'express';
import asyncHandler from 'express-async-handler';
import { IUser } from '@/domain/entities/models/user';
import { extractUserId } from '@/helpers/common.helper';
import {
  ResendOtpSchema,
  SignInAuthDto,
  SignInAuthSchema,
  TokenDto,
  TokenSchema,
  VerifyOtpDto,
  VerifyOtpSchema,
} from '@/validations/auth-validation';
import { BaseFindById } from '@/validations/base-validation';
import BaseController from '@/adapters/http/controller/_base-controller';

export default class AuthController extends BaseController {
  signIn = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params: SignInAuthDto = {
      username: req.body.username,
      password: req.body.password,
    };
    SignInAuthSchema.parse(params);

    const token = await this.useCases.authUseCase.signIn.execute(params);

    res.json({ message: 'Success', ...token });
  });

  signOut = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { id: extractUserId(req) };

    // BaseFindById.parse(params);

    await this.useCases.authUseCase.signOut.execute(params as BaseFindById);

    res.json({ message: 'Success' });
  });

  checkToken = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { token: req.headers.authorization?.replace('Bearer ', '') };
    TokenSchema.parse(params);

    res.json(await this.useCases.authUseCase.checkToken.execute(params as TokenDto));
  });

  refreshToken = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { token: req.body.refreshToken };
    TokenSchema.parse(params);

    const refreshToken = await this.useCases.authUseCase.refreshToken.execute(params as TokenDto);

    res.json({ message: 'Success', ...refreshToken });
  });

  resendOtp = asyncHandler(async (req: e.Request, res: e.Response) => {
    const userId = extractUserId(req);
    ResendOtpSchema.parse({ userId });

    const user = (await this.useCases.userUseCase.findByIdUser.execute({
      id: userId,
    } as BaseFindById)) as IUser;

    await this.useCases.authUseCase.sendOtp.execute(user, true);

    res.json({ message: 'Success' });
  });

  verifyOTP = asyncHandler(async (req: e.Request, res: e.Response) => {
    const params = { otp: req.body.otp, userId: extractUserId(req) };
    VerifyOtpSchema.parse(params);

    const _verifyOTP = await this.useCases.authUseCase.verifyOtp.execute(params as VerifyOtpDto);

    res.json({ message: 'Success', ..._verifyOTP });
  });
}
