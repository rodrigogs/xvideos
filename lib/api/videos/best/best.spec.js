/* eslint-disable padded-blocks */

const chai = require('chai');
const best = require('./best');

before(() => {
  chai.should();
});

describe('api/videos/best', () => {

  it('should list best video pages', async () => {
    const list = await best();

    list.should.be.an('object');
  }).timeout(10000);

});
