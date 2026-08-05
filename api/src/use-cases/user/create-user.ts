import { ErrorBadRequest } from '../../helpers/error.helper';
import * as password from '../../helpers/password.helper';
import { CreateUserDto, CreateUserProfileDto } from '../../validations/user-validation';
import BaseUseCase from '../_base-use-case';

export default class CreateUser extends BaseUseCase {
  async execute(payload: CreateUserDto | CreateUserProfileDto) {
    // HASH PASSWORD
    payload.password = await password.hash(payload.password);

    // DATE FORMAT DATE_OF_BIRTH
    if ('profile' in payload && payload?.profile && payload.profile.dateOfBirth)
      payload.profile.dateOfBirth = new Date(payload.profile.dateOfBirth);

    // CHECK UNIQUE USERNAME
    await this.checkUniqueUsername(payload.username);

    return this.repositories.userRepository.store(payload as CreateUserDto);
  }

  private async checkUniqueUsername(username: string) {
    // check unique username
    const countUsername = await this.repositories.userRepository.count({ username });

    if (countUsername > 0) throw new ErrorBadRequest('Nama pengguna telah digunakan.');
  }
}
