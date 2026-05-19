const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 1024x1024 SVG: 보라색 그라디언트 배경 + 흰색 원형 체크마크
const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#7c7af8"/>
    </linearGradient>
  </defs>
  <!-- 배경 -->
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <!-- 원형 (stroke) -->
  <circle cx="512" cy="512" r="280" fill="none" stroke="white" stroke-width="52" stroke-opacity="0.95"/>
  <!-- 체크마크: M9 12l2 2 4-4 → 512 기준 스케일 -->
  <!-- 원래: viewBox 0 0 24 24, 체크: M9 12 L11 14 L15 10 → 중심 12,12 -->
  <!-- 스케일: 24 → 560px (1024의 절반 + 여유), 오프셋 (1024-560)/2 = 232 -->
  <g transform="translate(232, 232) scale(23.33)">
    <path d="M9 12 L11 14 L15 10" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

const outDir = path.join(__dirname, '..', 'resources');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, 'icon.png');

sharp(Buffer.from(svg))
  .resize(1024, 1024)
  .png()
  .toFile(outPath)
  .then(() => console.log(`✅ icon.png 생성 완료: ${outPath}`))
  .catch(err => { console.error('오류:', err); process.exit(1); });
