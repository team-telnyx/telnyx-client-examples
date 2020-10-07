import TestFactory from '../TestFactory';

const testFactory = new TestFactory();

beforeEach(async () => {
  await testFactory.init();
});

afterEach(async () => {
  await testFactory.destroy();
});

test('testing test', () => {
  expect(true).toEqual(true);
});
