import BaseUseCase from '@/use-cases/_base-use-case';

export default class Dashboard extends BaseUseCase {
  async execute() {
    const count: Record<string, number> = {};
    count.user = await this.repositories.userRepository.count({});

    return count;
  }
}
