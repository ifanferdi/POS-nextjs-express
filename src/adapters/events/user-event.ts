import config from '../../config/config';
import { IUser } from '../../domain/entities/models/user';
import { Repositories } from '../../domain/repositories/repositories.interface';
import { UseCases } from '../../domain/use-cases/use-case.interface';

const EXCHANGE = config.rabbitmq.exchange;
const PARAMS_EVENT_A = { exchange: EXCHANGE, key: 'ts_user' };

export class UserEvent {
  constructor(
    private repositories: Repositories,
    private useCases: UseCases,
  ) {}

  async consumeA() {
    // type UserData diambil dari contract di folder root
    this.repositories.rabbitmqRepository?.subscribe(PARAMS_EVENT_A, (data: IUser) => {
      console.log(data);
      return this.handleConsumeQueue(data);
    });
  }

  /**
   * Consumer khusus mengambil queue yang gagal di jalankan oleh main queue
   */
  async consumeDeadQueueA() {
    // type UserData diambil dari contract di folder root
    this.repositories.rabbitmqRepository?.subscribeDeadQueue(PARAMS_EVENT_A, (data: IUser) => {
      console.log(data);
    });
  }

  private handleConsumeQueue(data: any) {
    try {
      // TODO: Do Use Case Here
    } catch (error) {
      // Jika terdapat error, fungsi ini akan return error ke rabbitmq-repository
      return error;
    }
  }
}
