import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { Seeder } from '../../../domain/infrastructures/database.interface';
import { calculateAge } from '../../../helpers/common.helper';
import * as argon2 from '../../../helpers/password.helper';
import { CreateUserProfileDto } from '../../../validations/user-validation';
import { Gender, PrismaClient } from '../prisma/generated/client';

export default class UserSeeder implements Seeder {
  constructor(private prisma: PrismaClient) {}

  public TOTAL_USER = 100;

  async execute(): Promise<void> {
    await this.seedUser();
  }

  private async seedUser() {
    const users = await this.factoryUser(this.TOTAL_USER);
    return Promise.all(
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
  }

  private async factoryUser(nUser: number = 1) {
    const factories = [];
    const password = await argon2.hash('password');
    const rolesKeyByName = _.keyBy(await this.prisma.role.findMany(), 'name');

    const factory = (username: string, roleId: number): CreateUserProfileDto => {
      const dateOfBirth = faker.date.between({ from: '1990-01-01', to: '2010-12-31' });
      return {
        username,
        password,
        isActive: true,
        roleId,
        profile: {
          fullName: faker.person.fullName(),
          placeOfBirth: faker.location.city(),
          dateOfBirth,
          gender: _.sample([Gender.male, Gender.female]),
          age: calculateAge(dateOfBirth),
        },
      };
    };

    factories.push(factory(`developer`, rolesKeyByName['Developer'].id));
    factories.push(factory(`admin`, rolesKeyByName['Admin'].id));
    for (let i = 1; i <= nUser; i++) factories.push(factory(`user${i}`, rolesKeyByName['User'].id));

    return factories;
  }
}
