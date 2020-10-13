import path from 'path';
import express from 'express';
import request from 'supertest';
import {
  Connection,
  createConnection,
  getConnection,
  getRepository,
} from 'typeorm';
import {
  Builder,
  fixturesIterator,
  Loader,
  Parser,
  Resolver,
} from 'typeorm-fixtures-cli';
import createApp from './createApp';

/* Set up and tear down server and db for tests */
class TestFactory {
  private _app?: express.Application;
  private _connection?: Connection;

  public get app(): request.SuperTest<request.Test> {
    return request(this._app);
  }

  public get connection() {
    return this._connection;
  }

  /*
   * Create app and db connection
   *
   * Usage:
   *  beforeAll(async () => {
   *    await testFactory.init();
   *  });
   */
  public async init() {
    this._connection = await createConnection({
      type: 'sqljs',
      database: new Uint8Array(),
      location: 'database',
      entities: ['**/entities/*.ts'],
      dropSchema: true,
      synchronize: true,
      logging: false,
    });
    this._app = createApp();
  }

  /*
   * Clean up app and db connection
   *
   * Usage:
   *  afterAll(async () => {
   *    await testFactory.close();
   *  });
   */
  public async close() {
    this._connection?.close();
  }

  /*
   * Clear database
   */
  public async clear() {
    // This works because `dropSchema` is specified
    await this.connection?.synchronize(/* dropBeforeSync: */ true);
  }

  /*
   * Load test data
   */
  public async loadFixtures() {
    try {
      const loader = new Loader();
      loader.load(path.resolve('./fixtures'));

      const resolver = new Resolver();
      const fixtures = resolver.resolve(loader.fixtureConfigs);
      const builder = new Builder(this.connection!, new Parser());

      for (const fixture of fixturesIterator(fixtures)) {
        const entity: any = await builder.build(fixture);
        await getRepository(entity.constructor.name).save(entity);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

export default TestFactory;
