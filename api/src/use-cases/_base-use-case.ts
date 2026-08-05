import { Repositories } from '../domain/repositories/repositories.interface';

export default abstract class BaseUseCase {
  constructor(protected repositories: Repositories) {}
}
