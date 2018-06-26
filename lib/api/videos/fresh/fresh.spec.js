/* eslint-disable padded-blocks */

const chai = require('chai');
const fresh = require('./fresh');

before(() => {
  chai.should();
});

describe('api/videos/fresh', () => {

  it('should list first video pages', async () => {
    const list = await fresh();

    list.should.be.an('object');
  }).timeout(10000);

});
