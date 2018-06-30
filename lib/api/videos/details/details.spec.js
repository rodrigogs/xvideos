/* eslint-disable padded-blocks */

const chai = require('chai');
const details = require('./details');
const dashboard = require('../dashboard');

before(() => {
  chai.should();
});

describe('api/videos/details', () => {

  it('should retrieve video details', async () => {
    const { videos } = await dashboard();

    const video = await details(videos[0]);

    video.should.be.an('object');
  }).timeout(10000);

});
