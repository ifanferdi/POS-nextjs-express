import config from '@/config/config';
import { JwtData } from '@/domain/entities/types/auth.types';
import { ErrorUnauthorized } from '@/helpers/error.helper';
import * as jwt from '@/helpers/jwt.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { TokenDto } from '@/validations/auth-validation';


export default class CheckToken extends BaseUseCase {
  async execute({ token }: TokenDto) {
    const tokenData: JwtData = jwt.verify(token);

    if (tokenData.iat) tokenData.iatDate = new Date(tokenData.iat * 1000);
    if (tokenData.exp) tokenData.expDate = new Date(tokenData.exp * 1000);

    return tokenData;
  }
}
