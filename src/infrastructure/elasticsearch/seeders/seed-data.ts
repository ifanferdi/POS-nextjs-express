import config from '../../../config/config';
import UserRepository from '../../../repositories/database/user-repository';
import ElasticsearchRepository from '../../../repositories/elasticsearch/elasticsearch-repository';
import { prisma } from '../../database/prisma/prisma';
import ElasticsearchClient from '../elasticsearch-connection';

(async () => {
  const start = Date.now();
  const index = config.elasticsearch.index;

  const elasticsearchRepository = new ElasticsearchRepository(ElasticsearchClient);
  const userRepository = new UserRepository(prisma);

  const users = await userRepository.findAll({
    limit: -1,
    orderBy: [{ field: 'id', direction: 'asc' }],
  });

  await elasticsearchRepository.bulkCreate({
    index: config.elasticsearch.index,
    prefix: 'user',
    data: users,
  });

  const end = Date.now();
  console.log(`✅  Seed index ${index} took: ${end - start}ms\n`);

  process.exit(0);
})();
