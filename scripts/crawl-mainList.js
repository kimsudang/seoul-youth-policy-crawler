import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://youth.seoul.go.kr/infoData/plcyInfo/ctList.do?sprtInfoId=&plcyBizId=&key=2309150002&sc_detailAt=&orderBy=regYmd+desc&blueWorksYn=N&tabKind=002&sw=';

export default async function crawlMainList() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🌀 마지막 페이지 번호 가져오는 중...');

  await page.goto(`${BASE_URL}&pageIndex=1`, { waitUntil: 'networkidle' });

  const lastPage = await page.$$eval('.pagination li:not(.next):not(.prev)', (pages) => {
    const numbers = pages.map((el) => parseInt(el.innerText)).filter(Boolean);
    return Math.max(...numbers);
  });

  console.log(`✅ 마지막 페이지: ${lastPage} 페이지`);

  const results = [];

  for (let pageIndex = lastPage; pageIndex >= 1; pageIndex--) {
    console.log(`📄 ${pageIndex} 페이지 크롤링 중...`);

    await page.goto(`${BASE_URL}&pageIndex=${pageIndex}`, { waitUntil: 'networkidle' });

    // 요소가 존재할 때까지 대기 (최대 5초)
    try {
      await page.waitForSelector('.board-list-box ul li', { timeout: 5000 });
    } catch (err) {
      console.log(`⚠️ ${pageIndex} 페이지에 게시글 요소가 없습니다 (건너뜀)`);
      continue;
    }

    const pageData = await page.$$eval('.board-list-box ul li', (items) => {
      return items.map((item) => ({
        title: item.querySelector('.board-title')?.innerText.trim(),
        link: item.querySelector('a')?.href,
        date: item.querySelector('.board-date')?.innerText.trim(),
      }));
    });

    console.log(`✅ ${pageIndex} 페이지에서 ${pageData.length}개의 항목 수집`);

    if (pageData.length === 0) {
      console.log(`🛑 ${pageIndex} 페이지는 비어 있음 → 종료`);
      break;
    }

    results.push(...pageData);
  }

  const outputPath = path.join(__dirname, '../data/main-policy-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`✅ [완료] 전체 ${results.length}개의 정책 저장됨`);

  await browser.close();
}
