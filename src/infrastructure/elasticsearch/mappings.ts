import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';

export const DataMapping: MappingTypeMapping = {
  date_detection: true,
  numeric_detection: true,
  dynamic_date_formats: [
    'yyyy-MM-dd',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy/MM/dd',
    'yyyy/MM/dd HH:mm:ss',
    'HH:mm:ss',
    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  ],
  // properties: {
  //   type: { type: 'keyword' },
  //   desc: { type: 'keyword' },
  // },
  dynamic_templates: [
    {
      strings: {
        match_mapping_type: 'string',
        mapping: { type: 'keyword', fields: { raw: { type: 'keyword', ignore_above: 256 } } },
      },
    },
  ],
};
