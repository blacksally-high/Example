import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../dist/server/index.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: worker } = await import(moduleUrl);
assert.equal(typeof worker?.fetch, 'function');

// 사용자 화면과 워드 내려받기 경로가 빌드에 포함됐는지 확인합니다.
const home = await worker.fetch(new Request('https://example.test/'), {}, {});
const html = await home.text();
assert.equal(home.status, 200);
assert.match(html, /<title>회의 관리 시스템<\/title>/);
const app = await worker.fetch(new Request('https://example.test/app.js'), {}, {});
const appCode = await app.text();
assert.match(appCode, /워드 보고서 \(\.docx\)/);
assert.match(appCode, /빈 워드 서식 \(\.docx\)/);
assert.match(appCode, /내용 반영/);

const template = await worker.fetch(new Request('https://example.test/api/report-template.docx'), { BUCKET: {} }, {});
const bytes = new Uint8Array(await template.arrayBuffer());
assert.equal(template.status, 200);
assert.equal(bytes[0], 0x50);
assert.equal(bytes[1], 0x4b);

// 저장소 연결이 없으면 파일을 읽는 척하지 않고 명확한 오류를 돌려줍니다.
const missingStorage = await worker.fetch(new Request('https://example.test/api/meetings'), {}, {});
assert.equal(missingStorage.status, 503);
console.log('Worker build and critical routes verified');

