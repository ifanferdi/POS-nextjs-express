import { OrderStatus } from '@/domain/entities/enums/order.enum';
import { PaymentMethod, PaymentStatus } from '@/domain/entities/enums/payment.enum';
import { Seeder } from '@/domain/infrastructures/database.interface';
import { calculateRounding } from '@/helpers/common.helper';
import {
  Category,
  PrismaClient,
  Product,
  ProductHasCategory,
} from '@/infrastructure/database/prisma/generated/client';
import { Decimal } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import {
  OrderCreateManyInput,
  OrderItemCreateManyInput,
  PaymentCreateManyInput,
} from '@/infrastructure/database/prisma/generated/models';
import { faker } from '@faker-js/faker';
import axios from 'axios';
import _ from 'lodash';
import Progress from 'ts-progress';

const TOTAL_PRODUCTS = 500_000;
const TOTAL_ORDERS = 250_000;
const CHUNK = 1000;

export default class PosSeeder implements Seeder {
  constructor(private prisma: PrismaClient) {}

  async execute(): Promise<void> {
    const categories = await this.seedCategories();
    const products = await this.seedProducts(categories);
    await this.seedOrders(products);
  }

  private async seedCategories() {
    const data = Array.from({ length: 100 }, (_: unknown, i: number) => ({
      name: faker.commerce.department(),
      description: faker.commerce.productDescription(),
    }));

    const categories = (await this.prisma.category.createManyAndReturn({
      data,
      skipDuplicates: true,
    })) as unknown as Promise<Category[]>;

    console.info('✅ Seed Categories');

    return categories;
  }

  private async seedProducts(categories: Category[]) {
    const images = await this.getDummyImages();

    let productProgress = Progress.create({
      updateFrequency: 150,
      total: TOTAL_PRODUCTS,
      title: `Seed Products: ${TOTAL_PRODUCTS}`,
      pattern:
        'Seeding: {bar.white.red.40} {percent} | Remaining: {remaining} | Elapsed: {elapsed}',
    });

    let products: Product[] = [];

    for (let chunk = 0; chunk < TOTAL_PRODUCTS; chunk += CHUNK) {
      const data = Array.from(
        { length: Math.min(CHUNK, TOTAL_PRODUCTS - chunk) },
        (__: unknown, i: number) => {
          const { images: dummyImages } = _.sample(images) ?? { thumbnail: undefined, images: [] };
          const index = chunk + i;
          const price = faker.number.int({ min: 5000, max: 500000 });
          const cost = Math.round(price * faker.number.float({ min: 0.3, max: 0.7 }));
          return {
            name: `${_.sample([
              faker.commerce.productName(),
              faker.food.fruit(),
              faker.food.vegetable(),
              faker.food.dish(),
              faker.commerce.product(),
            ])}-${faker.number.int({ max: 1000 })}`,
            imagePath: _.sample(dummyImages) ?? null,
            description: faker.helpers.maybe(() => faker.commerce.productDescription(), {
              probability: 0.8,
            }),
            price,
            cost,
            sku: `SKU-${String(index).padStart(8, '0')}${faker.string.alphanumeric(4)}`,
            barcode: `${faker.string.numeric(9)}${String(index).padStart(4, '0')}`,
            stock: faker.number.int({ min: 10, max: 200 }),
            isActive: faker.datatype.boolean(0.9),
          };
        },
      );
      products = [
        ...products,
        ...(await this.prisma.product.createManyAndReturn({ data, skipDuplicates: true })),
      ];
      data.forEach(() => productProgress.update());
    }
    productProgress.done();

    let productCategoriesProgress = Progress.create({
      updateFrequency: 150,
      total: products.length,
      title: `Seed Products Has Categories: ${products.length}`,
      pattern:
        'Seeding: {bar.white.red.40} {percent} | Remaining: {remaining} | Elapsed: {elapsed}',
    });

    for (let chunk = 0; chunk < products.length; chunk += CHUNK) {
      const productHasCategories: ProductHasCategory[] = [];
      const data = Array.from(
        { length: Math.min(CHUNK, products.length - chunk) },
        (__: unknown, i: number) => {
          const product = products[chunk + i];
          _.sampleSize(categories, faker.number.int({ min: 1, max: 5 })).map((category) =>
            productHasCategories.push({ productId: product.id, categoryId: category.id }),
          );
        },
      );
      await this.prisma.productHasCategory.createMany({
        data: productHasCategories,
        skipDuplicates: true,
      });
      data.forEach(() => productCategoriesProgress.update());
    }

    productCategoriesProgress.done();

    return products;
  }

  private async getDummyImages() {
    interface Product {
      thumbnail: string;
      images: string[];
    }
    interface DummyJsonResponse {
      products: Product[];
    }
    const { data } = await axios.get<DummyJsonResponse>('https://dummyjson.com/products', {
      params: { limit: 200 },
    });

    return data.products.map((p) => ({ thumbnail: p.thumbnail, images: p.images }));
  }

  private async seedOrders(products: Product[]) {
    const users = await this.prisma.user.findMany({ select: { id: true }, where: { roleId: 1 } });
    if (users.length < 1) return;
    const countAllUsers = await this.prisma.user.count();

    const weightedPaymentMethods = [
      ...Array(25).fill(PaymentMethod.CASH),
      ...Array(30).fill(PaymentMethod.QRIS),
      ...Array(15).fill(PaymentMethod.VA_BCA),
      ...Array(10).fill(PaymentMethod.VA_BNI),
      ...Array(10).fill(PaymentMethod.VA_BRI),
      ...Array(10).fill(PaymentMethod.VA_MANDIRI),
    ];

    let progress = Progress.create({
      updateFrequency: 150,
      total: TOTAL_ORDERS,
      title: `Seed Orders and Payments: ${TOTAL_ORDERS}`,
      pattern:
        'Seeding: {bar.white.red.40} {percent} | Remaining: {remaining} | Elapsed: {elapsed}',
    });

    for (let chunk = 1; chunk <= TOTAL_ORDERS; chunk += CHUNK) {
      const orders: OrderCreateManyInput[] = [];
      const orderItems: OrderItemCreateManyInput[] = [];
      const payments: PaymentCreateManyInput[] = [];

      Array.from({ length: Math.min(CHUNK, TOTAL_ORDERS - chunk) }, (__: unknown, i: number) => {
        const id = chunk + i;
        const cashier = _.sample(users);

        const paymentMethod = _.sample(weightedPaymentMethods)!;
        const status =
          paymentMethod === PaymentMethod.CASH
            ? _.sample([OrderStatus.COMPLETED, OrderStatus.CANCELLED])!
            : _.sample([OrderStatus.PENDING, OrderStatus.EXPIRED])!;

        const itemsCount = faker.number.int({ min: 1, max: 5 });
        const selectedProducts = _.sampleSize(products, itemsCount);

        const orderItemsData = selectedProducts.map((product) => {
          const quantity = faker.number.int({ min: 1, max: 5 });
          const unitPrice = product.price;
          const totalPrice = unitPrice * quantity;
          orderItems.push({ orderId: id, productId: product.id, quantity, unitPrice, totalPrice });
          return { productId: product.id, quantity, unitPrice, totalPrice };
        });

        const subtotal = _.sumBy(orderItemsData, 'totalPrice');
        const tax = Math.round(subtotal * 0.11);
        const discount = faker.number.int({ min: 0, max: Math.floor(subtotal * 0.1) });
        const total = subtotal + tax - discount;

        const paymentStatus =
          status === OrderStatus.COMPLETED
            ? PaymentStatus.SUCCESS
            : status === OrderStatus.EXPIRED
              ? PaymentStatus.EXPIRED
              : status === OrderStatus.CANCELLED
                ? PaymentStatus.CANCELLED
                : PaymentStatus.PENDING;

        const { rounding, total: totalRounding } =
          paymentMethod === PaymentMethod.CASH
            ? calculateRounding(new Decimal(total))
            : { rounding: 0, total };

        const paidAt = paymentStatus !== PaymentStatus.SUCCESS ? undefined : faker.date.anytime();
        const orderNumber = `INV-${String(id).padStart(6, '0')}`;

        orders.push({
          id,
          customerId: null,
          userId: faker.number.int({ min: 1, max: countAllUsers }),
          orderNumber,
          subtotal,
          tax,
          discount,
          total,
          status,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
        });
        payments.push({
          orderId: id,
          subtotal,
          rounding,
          total: totalRounding,
          amount: totalRounding,
          method: paymentMethod,
          reference: paymentMethod === PaymentMethod.CASH ? null : orderNumber,
          status: paymentStatus,
          paidAt,
        });
      });

      await this.prisma.order.createMany({ data: orders, skipDuplicates: true });
      await this.prisma.orderItem.createMany({ data: orderItems, skipDuplicates: true });
      await this.prisma.payment.createMany({ data: payments, skipDuplicates: true });

      payments.map(() => progress.update());
    }

    progress.done();

    // Sinkronkan sequence ke MAX(id) agar create() berikutnya tidak bentrok
    // (createMany dengan id eksplisit tidak mengadvances autoincrement sequence)
    await this.prisma.$executeRaw`
      SELECT setval(
        pg_get_serial_sequence('orders', 'id'),
        (SELECT COALESCE(MAX(id), 0) FROM orders) + 1,
        false
      )
    `;
  }
}
