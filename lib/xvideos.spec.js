/* eslint-disable padded-blocks */

const chai = require('chai');
const xvideos = require('.');

before(() => {
  chai.should();
});

describe('xvideos', () => {

  it('should have xvideos api functions', async () => {
    xvideos.should.be.an('object');
    xvideos.videos.should.be.an('object');
    xvideos.videos.dashboard.should.be.a('function');
    xvideos.videos.fresh.should.be.a('function');
    xvideos.videos.best.should.be.a('function');
    xvideos.videos.verified.should.be.a('function');
    xvideos.videos.details.should.be.a('function');
  }).timeout(10000);

});
