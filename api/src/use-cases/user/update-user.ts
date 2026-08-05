import { IUserWithPassword } from '../../domain/entities/models/user';
import { ErrorBadRequest } from '../../helpers/error.helper';
import * as password from '../../helpers/password.helper';
import { ChangePasswordDto, UpdateUserProfileDto } from '../../validations/user-validation';
import BaseUseCase from '../_base-use-case';

export default class UpdateUser extends BaseUseCase {
  async execute(payload: UpdateUserProfileDto, payloadPassword?: ChangePasswordDto) {
    // DATE FORMAT DATE_OF_BIRTH
    if ('profile' in payload && payload?.profile && payload.profile.dateOfBirth)
      payload.profile.dateOfBirth = new Date(payload.profile.dateOfBirth);

    // CHECK CHANGE PASSWORD
    const hashPassword = await this.handleChangePassword(payloadPassword, payload.id);

    // CHECK UNIQUE USERNAME
    await this.checkUniqueUsername(payload);

    payload.password = hashPassword;

    return this.repositories.userRepository.update(payload);
  }

  private async checkUniqueUsername(payload: UpdateUserProfileDto) {
    // check unique username
    const countUsername = await this.repositories.userRepository.count({
      username: payload.username,
      notId: payload.id,
    });

    if (countUsername > 0) throw new ErrorBadRequest('Nama pengguna telah digunakan.');
  }

  private async handleChangePassword(payloadPassword?: ChangePasswordDto, id?: number) {
    if (payloadPassword?.oldPassword && payloadPassword?.password && id) {
      const user = (await this.repositories.userRepository.findOne({
        id,
        isActive: true,
        columns: ['password'],
      })) as IUserWithPassword;
      const currentPassword = user.password;

      const isValidPassword = await password.verify(currentPassword, payloadPassword.oldPassword);
      if (!isValidPassword) throw new ErrorBadRequest('Password lama tidak valid.');

      return await password.hash(payloadPassword.password);
    }
  }
}
