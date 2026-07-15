import SendOtp from '../../use-cases/auth/2FA/send-otp';
import VerifyOtp from '../../use-cases/auth/2FA/verify-otp';
import Authorization from '../../use-cases/auth/authorization';
import CheckToken from '../../use-cases/auth/check-token';
import RefreshToken from '../../use-cases/auth/refresh-token';
import SignIn from '../../use-cases/auth/sign-in';
import SignOut from '../../use-cases/auth/sign-out';

export interface AuthUseCase {
  authorization: Authorization;
  checkToken: CheckToken;
  refreshToken: RefreshToken;
  signIn: SignIn;
  signOut: SignOut;
  sendOtp: SendOtp;
  verifyOtp: VerifyOtp;
}
