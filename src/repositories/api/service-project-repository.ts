import axiosHelper from '../../helpers/axios.helper';
import ApiBaseRepository from './_api-base-repository';

export default class ServiceProjectRepository extends ApiBaseRepository {
  findAll(params: Record<string, any>) {
    return axiosHelper(async () => {
      const { data } = await this.axiosInstance.get('/projects', { params });

      return data;
    });
  }
}
