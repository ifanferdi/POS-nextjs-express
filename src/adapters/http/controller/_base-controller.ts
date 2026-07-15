import { UseCases } from '../../../domain/use-cases/use-case.interface';

export default abstract class BaseController {
  constructor(protected useCases: UseCases) {}
}
