import { Client } from '@elastic/elasticsearch';
import { MappingTypeMapping, SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';
import { getOnlySourceData, idPrefixGenerator } from '../../helpers/elasticsearch.helper';
import { DataMapping } from '../../infrastructure/elasticsearch/mappings';

export default class ElasticsearchRepository {
  constructor(protected readonly client: Client) {}

  /**
   * Only create an index without adding documents
   */
  newIndex(index: string, mappings: MappingTypeMapping = DataMapping) {
    return this.client.indices.create({ index, mappings });
  }

  checkIndex(index: string) {
    return this.client.indices.exists({ index });
  }

  /**
   * Get document by id from index
   */
  async getById(index: string, id: string) {
    return getOnlySourceData(await this.client.get({ index, id }).catch((err) => err.meta.body));
  }

  /**
   * Counting document from index
   */
  async count(index: string) {
    return this.client.count({ index });
  }

  /**
   * Create Or Replace document
   */
  async create(payload: Record<string, any>) {
    const { index, data: document, prefix } = payload;

    // Create new index if not exists
    if (!(await this.checkIndex(index))) await this.newIndex(index);

    const id = idPrefixGenerator(document.id, prefix);

    return this.client.index({ index, id, document, refresh: true });
  }

  /**
   * bulk operations in one action
   * can be multiple operation like create, update, or delete
   * ref: https://www.elastic.co/guide/en/elasticsearch/reference/8.17/docs-bulk.html#docs-bulk-api-example
   */
  async bulkCreate(payload: Record<string, any>) {
    const { index: _index, data: documents, prefix } = payload;

    if (!(await this.checkIndex(_index))) await this.newIndex(_index);

    const operations = documents.flatMap((doc: Record<string, any>) => [
      { index: { _index, _id: idPrefixGenerator(doc.id, prefix) } },
      doc,
    ]);

    return this.client.bulk({ refresh: true, operations });
  }

  /**
   * Update document by id in index
   */
  async update(payload: Record<string, any>) {
    let { index, prefix, data: doc, id } = payload;
    const strId = idPrefixGenerator(id, prefix);

    return this.client.update({ index, id: strId, doc, refresh: true });
  }

  /**
   * Delete document by id from index
   */
  destroy = async (payload: Record<string, any>) => {
    const { index, id, prefix } = payload;

    return await this.client
      .delete({ index, id: idPrefixGenerator(id, prefix), refresh: true })
      .catch((err) => err?.meta?.body);
  };

  /**
   * Deleting an index
   */
  destroyIndex = async (index: string) =>
    await this.client.indices.delete({ index }).catch((err) => err?.meta?.body?.error);

  /**
   * ref query: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
   */
  // todo: ganti params dto
  findAll = async (index: string, params: Record<string, any> = {}) => {
    const { search, page = 1, limit = 10, queryType = 'filter' } = params;
    const { filter = {}, arrayFilter = {}, betweenFilter = {} } = params;
    const { searchSources = ['username'], sort = ['updatedAt:desc'] } = params;
    const searchQuery: Record<string, any>[] = [];
    const filterQuery: Record<string, any>[] = [];

    const offset = (page - 1) * limit;
    const payload: Record<string, any> = {
      index,
      size: limit === -1 ? undefined : limit,
      from: offset,
      sort: [] as Record<string, any>,
    };

    // sorting data with multiple column
    sort.map((string: string) => {
      const [sort, sortType] = string.split(':');
      payload.sort.push({ [sort]: sortType });
    });

    // searching data with multiple column
    if (search)
      searchSources.map((column: string) =>
        searchQuery.push({ wildcard: { [column]: `*${search}*` } }),
      );

    // filter data with multiple column
    if (Object.keys(filter).length > 0)
      Object.keys(filter).forEach((key) => filterQuery.push({ match: { [key]: filter[key] } }));

    // filter data with multiple column using IN query
    if (Object.keys(arrayFilter).length > 0)
      Object.keys(arrayFilter).forEach((key) => {
        if (arrayFilter[key].length) filterQuery.push({ terms: { [key]: arrayFilter[key] } });
      });

    // filter data with multiple column using BETWEEN query
    if (Object.keys(betweenFilter).length > 0)
      Object.keys(betweenFilter).forEach((key) =>
        filterQuery.push({
          range: { [key]: { gte: betweenFilter[key][0], lt: betweenFilter[key][1] } },
        }),
      );

    // assign all search and filter to object query
    if (filterQuery.length > 0 || searchQuery.length > 0) {
      const boolQuery = [];
      if (filterQuery.length > 0) boolQuery.push(...filterQuery);
      if (searchQuery.length > 0) boolQuery.push({ bool: { should: searchQuery } });
      payload.query = { bool: { [queryType]: boolQuery } };
    }

    // running query
    const { hits } = await this.client.search(payload);

    hits.hits = getOnlySourceData(hits.hits);

    return {
      data: hits.hits,
      total: hits.total as SearchTotalHits,
    };
  };
}
