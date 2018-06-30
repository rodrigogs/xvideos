/* eslint-disable padded-blocks */

const chai = require('chai');
const dashboard = require('./dashboard');

before(() => {
  chai.should();
});

describe('api/videos/dashboard', () => {

  it('should list dashboard video pages', async () => {
    const list = await dashboard();

    list.should.be.an('object');
  }).timeout(10000);

});
