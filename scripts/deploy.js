#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');

const PBXPROJ = 'ios/App/App.xcodeproj/project.pbxproj';

// 현재 MARKETING_VERSION 읽기
let pbx = fs.readFileSync(PBXPROJ, 'utf8');
const match = pbx.match(/MARKETING_VERSION = ([\d.]+);/);
if (!match) { console.error('MARKETING_VERSION을 찾을 수 없습니다.'); process.exit(1); }

const [major, minor] = match[1].split('.').map(Number);
const nextStr = `${major}.${minor + 1}`;

// MARKETING_VERSION 업데이트 (Debug + Release 두 곳)
pbx = pbx.replace(/MARKETING_VERSION = [\d.]+;/g, `MARKETING_VERSION = ${nextStr};`);

// CURRENT_PROJECT_VERSION 업데이트 (빌드 번호 +1)
const buildMatch = pbx.match(/CURRENT_PROJECT_VERSION = (\d+);/);
const nextBuild = buildMatch ? parseInt(buildMatch[1]) + 1 : 1;
pbx = pbx.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${nextBuild};`);

fs.writeFileSync(PBXPROJ, pbx);

// CURRENT_VERSION 상수 업데이트 (Vercel 빌드 캐시 우회)
const VERSION_FILES = ['components/Sidebar.tsx', 'components/SettingsView.tsx', 'components/AuthenticatedHome.tsx'];
for (const f of VERSION_FILES) {
  let src = fs.readFileSync(f, 'utf8');
  src = src.replace(/const CURRENT_VERSION = '[\d.]+'; \/\/ deploy:version/, `const CURRENT_VERSION = '${nextStr}'; // deploy:version`);
  fs.writeFileSync(f, src);
}

// public/version.json 업데이트 (웹 업데이트 감지용)
fs.writeFileSync('public/version.json', JSON.stringify({ version: nextStr }) + '\n');

console.log(`버전: ${major}.${minor} → ${nextStr}  (빌드: ${nextBuild})`);

// 빌드 + 배포
const run = cmd => execSync(cmd, { stdio: 'inherit' });
run('npm run build');
run('npx cap sync ios');
run('npx vercel --prod');
