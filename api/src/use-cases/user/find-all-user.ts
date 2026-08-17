import { IUser } from '@/domain/entities/models/user';
import { extractRelationData } from '@/helpers/extract-relationship';
import paginate from '@/helpers/paginate.helper';
import { FindAllUserDto } from '@/validations/user-validation';
import BaseUseCase from '@/use-cases/_base-use-case';

export default class FindAllUser extends BaseUseCase {
  async execute(params: FindAllUserDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.userRepository.findAll(params);
    const total = await this.repositories.userRepository.count(params);

    await Promise.all(
      data.map(async (user) => {
        if (params.with?.length) extractRelationData(params, user);
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
