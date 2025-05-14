const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://youth.seoul.go.kr/infoData/plcyInfo/ctList.do?sprtInfoId=&plcyBizId=&key=2309150002&sc_detailAt=&orderBy=regYmd+desc&blueWorksYn=N&tabKind=002&sw=';

async function crawlMainList() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🌀 마지막 페이지 번호 가져오는 중...');

  await page.goto(`${BASE_URL}&pageIndex=1`, { waitUntil: 'domcontentloaded' });

  const lastPage = await page.$$eval('.pagination li:not(.next):not(.prev)', (pages) => {
    const numbers = pages.map((el) => parseInt(el.innerText)).filter(Boolean);
    return Math.max(...numbers);
  });

  console.log(`✅ 마지막 페이지: ${lastPage} 페이지`);

  const results = [];

  for (let pageIndex = lastPage; pageIndex >= 1; pageIndex--) {
    console.log(`📄 ${pageIndex} 페이지 크롤링 중...`);

    await page.goto(`${BASE_URL}&pageIndex=${pageIndex}`, { waitUntil: 'domcontentloaded' });

    const pageData = await page.$$eval('.board-list-box ul li', (items) => {
      return items.map((item) => ({
        title: item.querySelector('.board-title')?.innerText.trim(),
        link: item.querySelector('a')?.href,
        date: item.querySelector('.board-date')?.innerText.trim(),
      }));
    });

    if (pageData.length === 0) {
      console.log(`🛑 ${pageIndex} 페이지는 비어 있음 → 종료`);
      break;
    }

    results.push(...pageData);
  }

  const outputPath = path.join(__dirname, '../data/main-policy-list.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`✅ 크롤링 완료! 총 ${results.length}개의 항목 저장됨`);

  await browser.close();
}

module.exports = crawlMainList;
