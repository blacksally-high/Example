#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
dist_root="$project_root/dist"

rm -rf "$dist_root"
mkdir -p "$dist_root/server"
cp "$project_root/worker/index.js" "$dist_root/server/index.js"

# 배포 파일에 라이선스를 포함한 JSZip 코드를 삽입합니다.
node - "$project_root" <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const output = path.join(root, 'dist/server/index.js');
const library = fs.readFileSync(path.join(root, 'worker/vendor/jszip.min.js'), 'utf8');
const source = fs.readFileSync(output, 'utf8');
const marker = "'__JSZIP_PLACEHOLDER__'";
if (!source.includes(marker)) throw new Error('JSZip 삽입 위치를 찾을 수 없습니다.');
fs.writeFileSync(output, source.replace(marker, JSON.stringify(library)));
JS

echo "Built $dist_root/server/index.js"

