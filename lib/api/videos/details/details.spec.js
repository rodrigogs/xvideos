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
    video.should.have.ownPropertyDescriptor('duration');
    video.duration.should.be.a('string');
    video.should.have.ownPropertyDescriptor('files');
    video.files.should.be.an('object');
    video.files.should.have.ownPropertyDescriptor('HLS');
    video.files.HLS.should.be.a('string');
    video.files.should.have.ownPropertyDescriptor('high');
    video.files.high.should.be.a('string');
    video.files.should.have.ownPropertyDescriptor('low');
    video.files.low.should.be.a('string');
    video.files.should.have.ownPropertyDescriptor('thumb');
    video.files.thumb.should.be.a('string');
    video.files.should.have.ownPropertyDescriptor('thumb69');
    video.files.thumb69.should.be.a('string');
    video.files.should.have.ownPropertyDescriptor('thumbSlide');
    video.files.thumbSlide.should.be.a('string');
    video.files.should.have.ownPropertyDescriptor('thumbSlideBig');
    video.files.thumbSlideBig.should.be.a('string');
    video.should.have.ownPropertyDescriptor('image');
    video.image.should.be.a('string');
    video.should.have.ownPropertyDescriptor('videoHeight');
    video.videoHeight.should.be.a('string');
    video.should.have.ownPropertyDescriptor('videoType');
    video.videoType.should.be.a('string');
    video.should.have.ownPropertyDescriptor('videoWidth');
    video.videoWidth.should.be.a('string');
    video.should.have.ownPropertyDescriptor('views');
    video.views.should.be.a('string');
  }).timeout(100000);

});
