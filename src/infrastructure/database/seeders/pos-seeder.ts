import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { Seeder } from '../../../domain/infrastructures/database.interface';
import { OrderStatus } from '../../../domain/entities/enums/order.enum';
import { PaymentMethod, PaymentStatus } from '../../../domain/entities/enums/payment.enum';
import { PrismaClient } from '../prisma/generated/client';

export default class PosSeeder implements Seeder {
  constructor(private prisma: PrismaClient) {}

  async execute(): Promise<void> {
    const categories = await this.seedProductCategories();
    const products = await this.seedProducts(categories);
    await this.seedOrders(products);
  }

  private async seedProductCategories() {
    const data = [
      { name: 'Makanan', description: 'Berbagai macam makanan' },
      { name: 'Minuman', description: 'Berbagai macam minuman' },
      { name: 'Snack', description: 'Cemilan ringan' },
      { name: 'Alat Tulis', description: 'Perlengkapan tulis-menulis' },
      { name: 'Elektronik', description: 'Barang elektronik' },
    ];

    const categories = [];
    for (const cat of data) {
      categories.push(await this.prisma.productCategory.create({ data: cat }));
    }
    return categories;
  }

  private async seedProducts(categories: Array<{ id: number; name: string }>) {
    const productNames = [
      'Nasi Goreng', 'Mie Ayam', 'Sate Ayam', 'Bakso', 'Soto Ayam',
      'Ayam Goreng', 'Ikan Bakar', 'Rendang', 'Gado-gado', 'Pecel Lele',
      'Es Teh', 'Es Jeruk', 'Kopi Hitam', 'Jus Alpukat', 'Jus Mangga',
      'Air Mineral', 'Teh Botol', 'Susu Segar', 'Kopi Susu', 'Matcha Latte',
      'Keripik Kentang', 'Cokelat Bar', 'Biskuit Gandum', 'Kacang Panggang', 'Wafer Cokelat',
      'Pulpen Biru', 'Pensil 2B', 'Buku Tulis A5', 'Penghapus Putih', 'Penggaris 30cm',
      'Kabel USB-C', 'Mouse Wireless', 'Keyboard Mechanical', 'Headset Bluetooth', 'Charger 65W',
    ];

    const products = [];
    for (const name of productNames) {
      const price = faker.number.int({ min: 5000, max: 500000 });
      const cost = Math.round(price * faker.number.float({ min: 0.3, max: 0.7 }));
      const product = await this.prisma.product.create({
        data: {
          name,
          description: faker.commerce.productDescription(),
          price,
          cost,
          sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
          barcode: faker.string.numeric(13),
          stock: faker.number.int({ min: 10, max: 200 }),
          isActive: faker.datatype.boolean(0.9),
          productHasCategories: {
            create: _.sampleSize(categories, faker.number.int({ min: 1, max: 2 })).map((cat) => ({
              categoryId: cat.id,
            })),
          },
        },
      });
      products.push(product);
    }
    return products;
  }

  private async seedOrders(products: Array<{ id: number; name: string; price: number }>) {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    if (users.length < 2) return;

    const paymentMethods = Object.values(PaymentMethod);

    for (let i = 1; i <= 30; i++) {
      const customer = _.sample(users)!;
      const cashier = _.sample(users.filter((u) => u.id !== customer.id)) ?? customer;

      const status = _.sample(Object.values(OrderStatus))!;
      const paymentMethod = _.sample(paymentMethods)!;

      const itemsCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = _.sampleSize(products, itemsCount);

      const orderItemsData = selectedProducts.map((product) => {
        const quantity = faker.number.int({ min: 1, max: 5 });
        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;
        return { productId: product.id, quantity, unitPrice, totalPrice };
      });

      const subtotal = _.sumBy(orderItemsData, 'totalPrice');
      const tax = Math.round(subtotal * 0.11);
      const discount = faker.number.int({ min: 0, max: Math.floor(subtotal * 0.1) });
      const total = subtotal + tax - discount;

      const paymentStatus =
        status === OrderStatus.COMPLETED
          ? PaymentStatus.COMPLETED
          : status === OrderStatus.CANCELLED
            ? PaymentStatus.FAILED
            : _.sample([PaymentStatus.PENDING, PaymentStatus.COMPLETED])!;

      await this.prisma.order.create({
        data: {
          customerId: customer.id,
          userId: cashier.id,
          orderNumber: `INV-${String(i).padStart(4, '0')}`,
          subtotal,
          tax,
          discount,
          total,
          status,
          paymentMethod,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
          orderItems: { create: orderItemsData },
          payments: {
            create: {
              amount: total,
              method: paymentMethod,
              reference: `PAY-${faker.string.alphanumeric(10).toUpperCase()}`,
              status: paymentStatus,
            },
          },
        },
      });
    }
  }
}
