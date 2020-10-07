import express from 'express';
import request from 'supertest';
import { Connection, createConnection } from 'typeorm';
import createApp from './helpers/createApp';

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

  public async init() {
    this._connection = await createConnection({
      type: 'sqljs',
      database: new Uint8Array(),
      location: 'database',
      entities: [__dirname + './entities/*.ts'],
      synchronize: true,
      logging: false,
    });
    this._app = createApp();
  }

  public async destroy() {
    this._connection?.close();
  }
}

export default TestFactory;
