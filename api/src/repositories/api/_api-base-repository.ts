import axios, { AxiosInstance } from 'axios';
import config from '../../config/config';

export default abstract class ApiBaseRepository {
  constructor(
    protected baseURL: string,
    protected axiosInstance: AxiosInstance = axios.create({
      baseURL,
      headers: { Accept: 'application/json' },
      timeout: config.api.timeout,
    }),
  ) {}
}
