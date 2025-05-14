import crawlMainList from './crawl-mainList.js';
import crawlGuList from './crawl-guList.js';

(async () => {
  await crawlMainList();
  await crawlGuList();
  console.log('✅ 두 개의 정책 크롤링 완료!');
})();
