export const entities = ['User', 'Role', 'Permission', 'Category', 'Product', 'Order', 'Payment'];
export const actions = ['Show', 'Manage'];

const data: string[] = ['Manage Self'];
entities.map((entity) => actions.map((action) => data.push(action + ' ' + entity)));

const permissionFactory = data.map((name) => ({ name }));

export default permissionFactory;
