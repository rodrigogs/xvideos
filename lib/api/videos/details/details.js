const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const details = async ({ url, puppeteerConfig } = {}) => {
  let browser;
  try {
    browser = await puppeteer.launch(puppeteerConfig);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const html = await page.content();

    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content');
    const duration = $('meta[property="og:duration"]').attr('content');
    const image = $('meta[property="og:image"]').attr('content');
    const videoType = $('meta[property="og:video:type"]').attr('content');
    const videoWidth = $('meta[property="og:video:width"]').attr('content');
    const videoHeight = $('meta[property="og:video:height"]').attr('content');
    const views = $('#nb-views-number').text();
    const videoScript = $('#video-player-bg > script:nth-child(6)').html();
    const files = {
      low: (videoScript.match('html5player.setVideoUrlLow\\(\'(.*?)\'\\);') || [])[1],
      high: videoScript.match('html5player.setVideoUrlHigh\\(\'(.*?)\'\\);' || [])[1],
      HLS: videoScript.match('html5player.setVideoHLS\\(\'(.*?)\'\\);' || [])[1],
      thumb: videoScript.match('html5player.setThumbUrl\\(\'(.*?)\'\\);' || [])[1],
      thumb69: videoScript.match('html5player.setThumbUrl169\\(\'(.*?)\'\\);' || [])[1],
      thumbSlide: videoScript.match('html5player.setThumbSlide\\(\'(.*?)\'\\);' || [])[1],
      thumbSlideBig: videoScript.match('html5player.setThumbSlideBig\\(\'(.*?)\'\\);' || [])[1],
    };

    return {
      title,
      url,
      duration,
      image,
      views,
      videoType,
      videoWidth,
      videoHeight,
      files,
    };
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = details;
