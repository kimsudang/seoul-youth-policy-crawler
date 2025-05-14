const crawlMainList = require('./crawl-mainList');
const crawlGuList = require('./crawl-guList');

(async () => {
  await crawlMainList();
  await crawlGuList();
  console.log('✅ 두 개의 정책 크롤링 완료!');
})();
