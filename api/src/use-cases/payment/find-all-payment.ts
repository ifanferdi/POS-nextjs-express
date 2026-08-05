import paginate from '../../helpers/paginate.helper';
import { FindAllPaymentDto } from '../../validations/payment-validation';
import BaseUseCase from '../_base-use-case';

export default class FindAllPayment extends BaseUseCase {
  async execute(params: FindAllPaymentDto) {
    const { page = 1, limit = 10 } = params;

    const data = await this.repositories.paymentRepository.findAll(params);
    const total = await this.repositories.paymentRepository.count(params);

    return paginate({ page, limit, total, data });
  }
}
