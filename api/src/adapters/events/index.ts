import { Repositories } from '@/domain/repositories/repositories.interface';
import { UseCases } from '@/domain/use-cases/use-case.interface';
import { UserEvent } from '@/adapters/events/user-event';

export default class EventListener {
  constructor(
    private repositories: Repositories,
    private useCases: UseCases,
  ) {}

  listen() {
    const userEvent = new UserEvent(this.repositories, this.useCases);

    // await userEvent.consumeA();
    // await userEvent.consumeDeadQueueA();
  }
}
