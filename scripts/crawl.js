// scripts/crawl.js
const fs = require('fs');
const path = require('path');

const sampleData = [
  {
    title: '테스트 정책',
    deadline: '2025-12-31',
    link: 'https://example.com',
  },
];

const filePath = path.join(__dirname, '../data/policy-list.json');

fs.writeFileSync(filePath, JSON.stringify(sampleData, null, 2), 'utf-8');

console.log('✔ 정책 데이터가 성공적으로 작성되었습니다!');
