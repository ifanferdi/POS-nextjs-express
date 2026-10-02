import _ from 'lodash';

export function getOnlySourceData(data: Record<string, any> | Record<string, any>[]) {
  return Array.isArray(data)
    ? data.map((item) => ({
        ..._.omit(item, ['_source', 'sort']),
        _sort: item?.sort,
        ...item._source,
      }))
    : {
        ..._.omit(data, ['_source', '_version', '_seq_no', '_primary_term', 'found']),
        _found: data.found,
        ...data._source,
      };
}

export function idPrefixGenerator(id: string | number, prefix?: string): string {
  return prefix ? `${prefix}-${id}` : (id as string);
}
