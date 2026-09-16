import { handleProfileImageUrl } from '@/helpers/data-extractor';
import { ErrorNotFound } from '@/helpers/error.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindByIdUserDto } from '@/validations/user-validation';

export default class FindByIdUser extends BaseUseCase {
  async execute(params: FindByIdUserDto) {
    const user = await this.repositories.userRepository.findOne(params);

    if (!user) throw new ErrorNotFound('Pengguna tidak ditemukan');

    await handleProfileImageUrl(this.repositories.storageRepository, user);

    return user;
  }
}
