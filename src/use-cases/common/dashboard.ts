import BaseUseCase from '../_base-use-case';

export default class Dashboard extends BaseUseCase {
  async execute() {
    const count: Record<string, number> = {};
    count.user = await this.repositories.userRepository.count({});

    return count;
  }
}
