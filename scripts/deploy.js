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

// Android build.gradle 업데이트 (versionName + buildLabel)
const GRADLE_FILE = 'android/app/build.gradle';
let gradle = fs.readFileSync(GRADLE_FILE, 'utf8');
gradle = gradle.replace(/versionName "[\d.]+"/, `versionName "${nextStr}"`);
gradle = gradle.replace(/versionCode \d+/, `versionCode ${major * 100 + (minor + 1)}`);
const buildLabel = `${nextStr.replace('.', '_')}_${nextBuild}`;
gradle = gradle.replace(/def buildLabel = "[^"]+" \/\/ deploy:buildLabel/, `def buildLabel = "${buildLabel}" // deploy:buildLabel`);
fs.writeFileSync(GRADLE_FILE, gradle);

// CURRENT_VERSION 상수 업데이트 (Vercel 빌드 캐시 우회)
const VERSION_FILES = ['components/Sidebar.tsx', 'components/SettingsView.tsx', 'components/AuthenticatedHome.tsx'];
for (const f of VERSION_FILES) {
  let src = fs.readFileSync(f, 'utf8');
  src = src.replace(/const CURRENT_VERSION = '[\d.]+'; \/\/ deploy:version/, `const CURRENT_VERSION = '${nextStr}'; // deploy:version`);
  fs.writeFileSync(f, src);
}

// public/version.json 업데이트 (웹 업데이트 감지용)
const isForce = process.argv.includes('--force');
const prevJson = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));
const newJson = { version: nextStr, minVersion: isForce ? nextStr : prevJson.minVersion ?? nextStr };
fs.writeFileSync('public/version.json', JSON.stringify(newJson) + '\n');
if (isForce) console.log(`강제 업데이트: minVersion → ${nextStr}`);

console.log(`버전: ${major}.${minor} → ${nextStr}  (빌드: ${nextBuild})`);

// 빌드 + iOS/Android 동기화 + Vercel 배포 + Xcode 열기 + Android AAB 빌드
const JAVA_HOME = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
run('npm run build');
run('npx cap sync ios');
run('npx cap sync android');
run('npx vercel --prod');
run('npx cap open ios');
run('./gradlew bundleRelease', {
  cwd: 'android',
  env: { ...process.env, JAVA_HOME },
});
console.log(`\nAndroid AAB: android/app/build/outputs/bundle/release/Plenio_${buildLabel}.aab`);
