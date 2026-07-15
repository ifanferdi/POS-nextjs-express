import { Client } from '@elastic/elasticsearch';
import config from '../../config/config';

export default new Client({
  node: config.elasticsearch.host,
  auth: { apiKey: config.elasticsearch.apiKey },
});
