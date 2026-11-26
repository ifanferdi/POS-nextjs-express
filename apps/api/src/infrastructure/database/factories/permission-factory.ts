export const entities = [
  'User',
  'Role',
  'Permission',
  'Category',
  'Product',
  'Product Discount Cycle',
  'Order',
  'Payment',
];
export const actions = ['Show', 'Manage'];

const data: string[] = [];
entities.map((entity) => actions.map((action) => data.push(action + ' ' + entity)));

const permissionFactory = data.map((name) => ({ name }));

export default permissionFactory;
