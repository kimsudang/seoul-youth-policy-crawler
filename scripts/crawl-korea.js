import crawlKoreaList from './crawl-koreaList.js';
import crawlRegionList from './crawl-regionList.js';

const main = async () => {
  await crawlKoreaList();
  await crawlRegionList();
  console.log('✅ 전국 정책 크롤링 완료!');
};

main();
