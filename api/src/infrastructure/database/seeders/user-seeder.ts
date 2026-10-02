import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { Gender } from '@/domain/entities/enums/user.enum';
import { Seeder } from '@/domain/infrastructures/database.interface';
import { calculateAge } from '@/helpers/common.helper';
import * as argon2 from '@/helpers/password.helper';
import { PrismaClient } from '@/infrastructure/database/prisma/generated/client';

export default class UserSeeder implements Seeder {
  constructor(private prisma: PrismaClient) {}

  public TOTAL_USER = 100;

  async execute(): Promise<void> {
    await this.seedUser();
  }

  private async seedUser() {
    const users = await this.factoryUser(this.TOTAL_USER);
    Promise.all(
      users.map(
        async (user) =>
          await this.prisma.user.create({
            data: {
              ..._.omit(user, 'profile'),
              profile: { create: user.profile },
            },
          }),
      ),
    );

    console.info('✅ Seed Users');
  }

  private async factoryUser(nUser: number = 1) {
    const factories = [];
    const password = await argon2.hash('password');
    const rolesKeyByName = _.keyBy(await this.prisma.role.findMany(), 'name');

    const factory = (username: string, roleId: number) => {
      const dateOfBirth = faker.date.between({ from: '1990-01-01', to: '2010-12-31' });
      const gender = _.sample([Gender.MALE, Gender.FEMALE])!;
      return {
        username,
        email: `${username}@example.com`,
        password,
        isActive: true,
        roleId,
        profile: {
          fullName: faker.person.fullName({ sex: gender === Gender.MALE ? 'male' : 'female' }),
          placeOfBirth: faker.location.city(),
          dateOfBirth,
          gender,
          age: calculateAge(dateOfBirth),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
        },
      };
    };

    factories.push(factory(`developer`, rolesKeyByName['Developer'].id));
    factories.push(factory(`admin`, rolesKeyByName['Admin'].id));
    for (let i = 1; i <= nUser; i++) factories.push(factory(`user${i}`, rolesKeyByName['User'].id));

    return factories;
  }
}
