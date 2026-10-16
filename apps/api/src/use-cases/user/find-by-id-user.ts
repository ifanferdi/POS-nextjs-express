import { IUser } from '@/domain/entities/models/user';
import { extractRelationDataUser, handleProfileImageUrl } from '@/helpers/data-extractor';
import { ErrorNotFound } from '@/helpers/error.helper';
import { FindByIdUserDto } from '@/validations/user-validation';
import BaseUseCase from '../_base-use-case';

export default class FindByIdUser extends BaseUseCase {
  async execute<T = IUser>(params: FindByIdUserDto) {
    const user = await this.repositories.userRepository.findOne<T>(params);

    if (!user) throw new ErrorNotFound('Pengguna tidak ditemukan');

    await handleProfileImageUrl(this.repositories.storageRepository, user);
    extractRelationDataUser(params, user);

    return user;
  }
}
