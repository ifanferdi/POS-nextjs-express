import { IUser } from '../../domain/entities/models/user';
import { ErrorNotFound } from '../../helpers/error.helper';
import { extractRelationData } from '../../helpers/extract-relationship';
import { FindByIdUserDto } from '../../validations/user-validation';
import BaseUseCase from '../_base-use-case';

export default class FindByIdUser extends BaseUseCase {
  async execute(params: FindByIdUserDto) {
    const user = (await this.repositories.userRepository.findOne(params)) as IUser;
    if (!user) throw new ErrorNotFound('Pengguna tidak ditemukan');

    extractRelationData(params, user);

    return user;
  }
}
