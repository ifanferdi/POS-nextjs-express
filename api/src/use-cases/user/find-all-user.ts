import { handleProfileImageUrl } from '@/helpers/data-extractor';
import paginate from '@/helpers/paginate.helper';
import BaseUseCase from '@/use-cases/_base-use-case';
import { FindAllUserDto } from '@/validations/user-validation';

export default class FindAllUser extends BaseUseCase {
  async execute(params: FindAllUserDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.userRepository.findAll(params);
    const total = await this.repositories.userRepository.count(params);

    await Promise.all(
      data.map(
        async (user) => await handleProfileImageUrl(this.repositories.storageRepository, user),
      ),
    );

    return paginate({ page, limit, total, data });
  }
}
