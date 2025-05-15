import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://youth.seoul.go.kr/infoData/youthPlcyInfo/list1.do?plcyBizId=&key=2309160001&sc_detailAt=&pageIndex=1&orderBy=regYmd+desc&blueWorksYn=N&tabKind=002&sw=';

export default async function crawlKoreaList() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🌀 [전체정책] 마지막 페이지 번호 가져오는 중...');

  await page.goto(`${BASE_URL}&pageIndex=1`, { waitUntil: 'networkidle' });

  const lastPage = await page.$eval('.pagination a.last', (el) => {
    const onclick = el.getAttribute('onclick');
    const match = onclick.match(/fn_egov_link_page\((\d+)\)/);
    return match ? parseInt(match[1]) : 1;
  });

  console.log(`✅ [전체정책] 마지막 페이지: ${lastPage} 페이지`);

  const results = [];

  for (let pageIndex = lastPage; pageIndex >= 1; pageIndex--) {
    console.log(`📄 [전체정책] ${pageIndex} 페이지 크롤링 중...`);

    await page.goto(`${BASE_URL}&pageIndex=${pageIndex}`, { waitUntil: 'networkidle' });

    try {
      await page.waitForSelector('ul.policy-list > li', { timeout: 5000 });
    } catch {
      console.log(`⚠️ [전체정책] ${pageIndex} 페이지에 리스트 없음 (건너뜀)`);
      continue;
    }

    const pageData = await page.$$eval('ul.policy-list > li', (items) =>
      items.map((item) => ({
        region: item.querySelector('span')?.innerText.trim() ?? null,
        title: item.querySelector('.tit')?.innerText.trim() ?? null,
        description: item.querySelector('.txt-over1')?.innerText.trim() ?? null,
        fullLink: item.querySelector('a')?.getAttribute('onclick') ?? null,
        link: item.querySelector('a')?.getAttribute('onclick').slice(9, -3) ?? null,
      }))
    );

    console.log(`✅ [전체정책] ${pageIndex} 페이지에서 ${pageData.length}개 수집됨`);

    results.push(...pageData);
  }

  const outputPath = path.join(__dirname, '../data/korea-policy-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`🎉 [전체정책 완료] 총 ${results.length}개 저장됨`);
  await browser.close();
}
