/* eslint-disable padded-blocks */

const chai = require('chai');
const verified = require('./verified');

before(() => {
  chai.should();
});

describe('api/videos/verified', () => {

  it('should list verified video pages', async () => {
    const list = await verified();

    list.should.be.an('object');
  }).timeout(10000);

});
