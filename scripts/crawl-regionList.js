import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { removeDuplicates } from '../util/removeDuplicates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://youth.seoul.go.kr/infoData/youthPlcyInfo/list2.do?plcyBizId=&key=2309160001&sc_detailAt=';

export default async function crawlRegionList() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🌀 [지역정책] 마지막 페이지 번호 가져오는 중...');

  await page.goto(`${BASE_URL}&pageIndex=1`, { waitUntil: 'networkidle' });

  const lastPage = await page.$eval('.pagination a.last', (el) => {
    const onclick = el.getAttribute('onclick');
    const match = onclick.match(/fn_egov_link_page\((\d+)\)/);
    return match ? parseInt(match[1]) : 1;
  });

  console.log(`✅ [지역정책] 마지막 페이지: ${lastPage} 페이지`);

  const results = [];

  for (let pageIndex = lastPage; pageIndex >= 1; pageIndex--) {
    console.log(`📄 [지역정책] ${pageIndex} 페이지 크롤링 중...`);

    await page.goto(`${BASE_URL}&pageIndex=${pageIndex}`, {
      waitUntil: 'networkidle',
    });

    try {
      await page.waitForSelector('ul.policy-list > li', { timeout: 5000 });
    } catch {
      console.log(`⚠️ [지역정책] ${pageIndex} 페이지에 리스트 없음 (건너뜀)`);
      continue;
    }

    const pageData = await page.$$eval('ul.policy-list > li', (items) =>
      items.map((item) => ({
        caetgory: '',
        region:
          item.querySelector('span')?.innerText.trim() ??
          item.querySelector('.tit')?.innerText.trim().slice(0, 2) ??
          null,
        title: item.querySelector('.tit')?.innerText.trim() ?? null,
        description: item.querySelector('.txt-over1')?.innerText.trim() ?? null,
        fullLink: item.querySelector('a')?.getAttribute('onclick') ?? null,
        link: item.querySelector('a')?.getAttribute('onclick').slice(8, -3) ?? null,
      }))
    );

    console.log(`✅ [지역정책] ${pageIndex} 페이지에서 ${pageData.length}개 수집됨`);

    results.push(...pageData);
  }

  // ✅ 중복 제거
  console.log(`🗂️ [지역정책] 중복 제거 전: ${results.length}개`);
  const deduped = removeDuplicates(results, (item) => item.link);
  console.log(`✅ [지역정책] 중복 제거 후: ${deduped.length}개 (중복 ${results.length - deduped.length}개 제거)`);

  // ✅ deduped로 저장
  const outputPath = path.join(__dirname, '../data/region-policy-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(deduped, null, 2), 'utf-8');

  console.log(`🎉 [지역정책 완료] 최종 ${deduped.length}개 저장됨`);
  await browser.close();
}
