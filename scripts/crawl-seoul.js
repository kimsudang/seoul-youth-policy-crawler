import crawlSeoulList from './crawl-seoulList.js';
import crawlSeoulGuList from './crawl-seoulGuList.js';

const main = async () => {
  await crawlSeoulList();
  await crawlSeoulGuList();
  console.log('✅ 서울시 정책 크롤링 완료!');
};

main();
