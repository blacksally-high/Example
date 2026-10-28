# 회의 관리 시스템

회의 원문, 진행상황, 참석자 서명, 첨부 파일, 후속 업무와 회의결과 보고서를 한곳에서 관리하는 웹 프로그램입니다. 현재 운영 중인 [비공개 사이트](https://meeting-control-20261028.blondstone19.chatgpt.site/)의 실행 소스를 보관합니다. 사이트에 저장된 회의 데이터나 파일은 이 공개 GitHub 저장소에 포함하지 않습니다.

## 1. 프로젝트 개요와 폴더 구조

화면과 API는 하나의 Cloudflare Worker에서 실행되며, 회의 기록과 첨부 원본은 Cloudflare R2에 저장합니다. Word 및 Excel 본문 읽기는 브라우저에서 수행합니다. 녹음·동영상의 음성 인식은 지원 브라우저의 음성 기능에 의존하고, 전사 결과는 사람이 검토한 후 반영합니다.

```text
Example/
├── .github/workflows/meeting-management-check.yml  # 변경 시 빌드 검사
└── meeting-management-system/
    ├── .gitignore
    ├── README.md
    ├── package.json
    ├── wrangler.jsonc.example
    ├── scripts/
    │   ├── build.sh
    │   └── check.mjs
    └── worker/
        ├── index.js
        └── vendor/
            ├── jszip.min.js
            └── JSZip-LICENSE.md
```

`worker/index.js`에 화면, 파일 업로드 API, 보고서 생성 코드가 모두 들어 있습니다. `scripts/build.sh`는 JSZip 코드를 포함한 배포 파일 `dist/server/index.js`를 만듭니다. `dist/`는 생성물이므로 Git에 올리지 않습니다.

## 2. 필수 설정 파일

- `.gitignore`: 환경 변수, 로컬 Wrangler 설정, 빌드 결과, 의존성 폴더와 macOS 임시 파일을 제외합니다.
- `package.json`: Node.js 20 이상, 빌드·검사·개발·배포 명령과 Wrangler 개발 의존성을 정의합니다.
- `wrangler.jsonc.example`: R2 바인딩 `BUCKET`을 위한 예시입니다. 실제 버킷 이름은 공개 저장소에 넣지 않고 로컬 `wrangler.jsonc`에만 입력합니다.

API 키, 비밀번호, 사용자 회의 기록, 참석자 정보, 서명 파일은 소스에 저장하지 마세요. GitHub Actions에서 Cloudflare 토큰이 필요한 경우 GitHub Secrets를 사용하세요.

## 3. 핵심 소스 코드와 기능

- 회의 정보, `[M01]` 회의록 원문, `[P01]` 진행 기록, 후속 업무와 기한 분류
- 녹음·동영상·사진·Word·Excel·참석자 서명 파일의 분할 업로드 및 R2 보관
- `.docx`, `.xlsx`, CSV, 텍스트의 내용 추출, 검토 후 회의록 또는 진행상황에 반영
- 지원 브라우저에서 녹음·동영상 **음성**을 전사하고 검토 후 반영
- Markdown, JSON, 채워진 Word 보고서, 빈 Word 서식 내려받기

영상의 **화면 내용**, 사진 및 PDF의 본문은 자동 분석하지 않습니다. 음성 인식 지원과 정확도는 브라우저에 따라 다릅니다. 원문과 증빙을 확인한 뒤 후속 업무를 확정하세요.

## 4. 설치 및 실행

저장소를 복제한 뒤 하위 폴더에서 실행합니다.

```sh
git clone https://github.com/blacsally/Example.git
cd Example/meeting-management-system
npm install
npm run build
npm run check
```

로컬에서 R2를 사용하는 개발 서버를 실행하려면 Cloudflare 계정에 로그인하고 비공개 R2 버킷을 준비하세요. 예시 설정을 복사해 실제 버킷 이름을 넣습니다.

```sh
cp wrangler.jsonc.example wrangler.jsonc
npx wrangler login
npx wrangler r2 bucket create YOUR_PRIVATE_R2_BUCKET_NAME
npm run dev
```

`wrangler.jsonc`의 `bucket_name`을 실제로 만든 버킷 이름으로 바꾸세요. 로컬 개발용 R2 데이터는 운영 버킷 데이터와 별도로 저장됩니다. 기존 비공개 사이트의 회의 자료는 자동으로 새 버킷에 복사되지 않습니다.

**기술 스택:** JavaScript ES 모듈, Cloudflare Workers, Cloudflare R2, HTML/CSS, JSZip, Wrangler.

## 5. Git 업로드 명령

이 프로젝트는 이미 `Example` 저장소의 하위 폴더에 있으므로, 변경할 때 하위 폴더에서 별도의 `git init`을 실행하지 않습니다.

```sh
cd Example
git pull --ff-only origin main
git add meeting-management-system .github/workflows/meeting-management-check.yml README.md
git commit -m "feat: add meeting management system source"
git push origin main
```

별도의 새 저장소로 분리할 때만 다음과 같이 Git을 초기화합니다. `<YOUR_GITHUB_USERNAME>`과 저장소 이름은 실제 값으로 바꾸세요.

```sh
git init
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY>.git
git add .
git commit -m "feat: add meeting management system"
git push -u origin main
```

## 6. 배포와 자동화

`Example`의 기존 GitHub Pages는 정적 파일을 게시합니다. 이 프로그램은 서버 API와 R2가 필요하므로 GitHub Pages에 소스 폴더를 올리는 것만으로는 동작하지 않습니다. 현재 [운영 사이트](https://meeting-control-20261028.blondstone19.chatgpt.site/)는 별도의 비공개 Sites 배포로 유지됩니다. GitHub 소스 변경은 그 사이트에 자동 반영되지 않습니다.

독립적인 Cloudflare 배포가 필요하면 먼저 **Cloudflare Access 등으로 사용자 접근을 제한**하고 R2 버킷을 연결하세요. 이 소스 자체에는 별도 로그인 검증이 없으므로 공개 Worker URL로 회의 자료를 운영하면 안 됩니다. 예시 설정의 `workers_dev: false`는 기본 공개 주소를 열지 않도록 합니다. 접근 정책과 비공개 경로를 설정한 후에만 다음 명령을 실행하세요.

```sh
npm run check
npm run deploy
```

저장소 루트의 `.github/workflows/meeting-management-check.yml`은 이 폴더가 바뀌면 빌드와 핵심 경로를 자동 검사합니다. 배포 자동화에는 Cloudflare 계정·R2 버킷·비공개 접근 설정과 GitHub Secrets의 배포 토큰이 추가로 필요합니다. 이 저장소에는 그런 자격 증명을 넣지 않았습니다.

참고: [Cloudflare Worker·R2 설정](https://developers.cloudflare.com/workers/wrangler/configuration/), [Cloudflare R2 CLI](https://developers.cloudflare.com/r2/get-started/cli/), [GitHub Pages의 서버 코드 제한](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

