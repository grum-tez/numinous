import { Greeter } from './../src/index';
const assert = require('assert')


describe('Greeter', () => {
  it('should return a string', () => {
    assert(Greeter('World') === 'Hello World');
  });
})