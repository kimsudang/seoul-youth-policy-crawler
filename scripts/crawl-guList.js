import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname 대체 코드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://youth.seoul.go.kr/infoData/plcyInfo/guList.do?plcyBizId=&tab=001&key=2309150002&sc_detailAt=&orderBy=regYmd+desc&blueWorksYn=N&tabKind=003&sw=';

export default async function crawlGuList() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🌀 [구정책] 마지막 페이지 번호 가져오는 중...');

  await page.goto(`${BASE_URL}&pageIndex=1`, { waitUntil: 'domcontentloaded' });

  const lastPage = await page.$$eval('.pagination li:not(.next):not(.prev)', (pages) => {
    const numbers = pages.map((el) => parseInt(el.innerText)).filter(Boolean);
    return Math.max(...numbers);
  });

  console.log(`✅ [구정책] 마지막 페이지: ${lastPage} 페이지`);

  const results = [];

  for (let pageIndex = lastPage; pageIndex >= 1; pageIndex--) {
    console.log(`📄 [구정책] ${pageIndex} 페이지 크롤링 중...`);

    await page.goto(`${BASE_URL}&pageIndex=${pageIndex}`, { waitUntil: 'domcontentloaded' });

    const pageData = await page.$$eval('.board-list-box ul li', (items) => {
      return items.map((item) => ({
        title: item.querySelector('.board-title')?.innerText.trim(),
        link: item.querySelector('a')?.href,
        date: item.querySelector('.board-date')?.innerText.trim(),
      }));
    });

    if (pageData.length === 0) {
      console.log(`🛑 [구정책] ${pageIndex} 페이지는 비어 있음 → 종료`);
      break;
    }

    results.push(...pageData);
  }

  const outputPath = path.join(__dirname, '../data/gu-policy-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`✅ [구정책] 크롤링 완료! 총 ${results.length}개의 항목 저장됨`);

  await browser.close();
}
