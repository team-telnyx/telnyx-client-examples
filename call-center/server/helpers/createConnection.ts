import 'reflect-metadata';
import { createConnection } from 'typeorm';

export default function () {
  return createConnection({
    type: 'sqlite',
    database: ':memory:',
    entities: [__dirname + '../entities/*.ts'],
    synchronize: true,
    logging: true,
  });
}
