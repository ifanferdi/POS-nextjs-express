import { faker } from '@faker-js/faker';
import axios from 'axios';
import _ from 'lodash';
import Progress from 'ts-progress';
import { OrderStatus } from '@/domain/entities/enums/order.enum';
import { PaymentMethod, PaymentStatus } from '@/domain/entities/enums/payment.enum';
import { ICategory } from '@/domain/entities/models/category';
import { IProduct, IProductHasCategory } from '@/domain/entities/models/product';
import { Seeder } from '@/domain/infrastructures/database.interface';
import { calculateRounding } from '@/helpers/common.helper';
import { PrismaClient, Product } from '@/infrastructure/database/prisma/generated/client';
import {
  OrderCreateManyInput,
  OrderItemCreateManyInput,
  PaymentCreateManyInput,
} from '@/infrastructure/database/prisma/generated/models';

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
      name: `${faker.commerce.department()} ${i}`,
      description: faker.commerce.productDescription(),
    }));

    const categories = (await this.prisma.category.createManyAndReturn({
      data,
      skipDuplicates: true,
    })) as unknown as Promise<ICategory[]>;

    console.info('✅ Seed Categories');

    return categories;
  }

  private async seedProducts(categories: ICategory[]) {
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
            imagePath: _.sample(images)?.download_url ?? null,
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
      title: `Seed Products Has Categories ${products.length}`,
      pattern:
        'Seeding: {bar.white.red.40} {percent} | Remaining: {remaining} | Elapsed: {elapsed}',
    });

    for (let chunk = 0; chunk < products.length; chunk += CHUNK) {
      const productHasCategories: IProductHasCategory[] = [];
      const data = Array.from(
        { length: Math.min(CHUNK, products.length - chunk) },
        (__: unknown, i: number) => {
          const product = products[i];
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
    interface ImagesResponse {
      id: string;
      author: string;
      width: number;
      height: number;
      url: string;
      download_url: string;
    }
    return (
      await axios.get<ImagesResponse[]>('https://picsum.photos/v2/list', {
        params: { limit: 100 },
      })
    ).data;
  }

  private async seedOrders(products: IProduct[]) {
    const users = await this.prisma.user.findMany({ select: { id: true }, where: { roleId: 1 } });
    if (users.length < 1) return;

    const paymentMethods = Object.values(PaymentMethod);
    let progress = Progress.create({
      updateFrequency: 150,
      total: TOTAL_ORDERS,
      title: `Seed Orders and Payments ${TOTAL_ORDERS}`,
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

        const status = _.sample(Object.values(OrderStatus))!;
        const paymentMethod = _.sample(paymentMethods)!;

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
            ? PaymentStatus.COMPLETED
            : status === OrderStatus.CANCELLED
              ? PaymentStatus.FAILED
              : _.sample([PaymentStatus.PENDING, PaymentStatus.COMPLETED])!;

        const { rounding, total: totalRounding } = calculateRounding(total);

        orders.push({
          id,
          customerId: null,
          userId: cashier?.id ?? 1,
          orderNumber: `INV-${String(id).padStart(6, '0')}`,
          subtotal,
          tax,
          discount,
          total,
          status,
          paymentMethod,
          notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
        });
        payments.push({
          orderId: id,
          subtotal,
          rounding,
          total: totalRounding,
          amount: totalRounding,
          method: paymentMethod,
          reference:
            paymentMethod === PaymentMethod.CASH
              ? null
              : `PAY-${faker.string.alphanumeric(10).toUpperCase()}`,
          status: paymentStatus,
        });
      });

      await this.prisma.order.createMany({ data: orders, skipDuplicates: true });
      await this.prisma.orderItem.createMany({ data: orderItems, skipDuplicates: true });
      await this.prisma.payment.createMany({ data: payments, skipDuplicates: true });

      payments.map(() => progress.update());
    }

    progress.done();
  }
}
