import ElasticsearchRepository from '../../../repositories/elasticsearch/elasticsearch-repository';
import config from '../../../config/config';
import ElasticsearchClient from '../elasticsearch-connection';

(async () => {
  const elasticsearchRepository = new ElasticsearchRepository(ElasticsearchClient);
  const index = config.elasticsearch.index;

  if (await elasticsearchRepository.checkIndex(index))
    await elasticsearchRepository.destroyIndex(index);

  console.log(`✅  Drop index: ${index}`);
})();
