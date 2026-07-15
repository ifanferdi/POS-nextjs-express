import { IUser } from '../../domain/entities/models/user';
import paginate from '../../helpers/paginate.helper';
import { FindAllUserDto } from '../../validations/user-validation';
import BaseUseCase from '../_base-use-case';
import FindByIdUser from './find-by-id-user';

export default class FindAllUser extends BaseUseCase {
  private findBydIdUser = new FindByIdUser(this.repositories);

  async execute(params: FindAllUserDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.userRepository.findAll(params);
    const total = await this.repositories.userRepository.count(params);

    await Promise.all(
      data.map(async (user) => {
        if (params.with?.length) this.findBydIdUser.extractRelationData(params, user);
        await this.handleProfileImageUrl(user);
      }),
    );

    return paginate({ page, limit, total, data });
  }

  async handleProfileImageUrl(user: IUser) {
    if (user.profile?.imagePath)
      user.profile.imageUrl = await this.repositories.storageRepository?.getUrl(
        user.profile?.imagePath,
      );
  }
}
