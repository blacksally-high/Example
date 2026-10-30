# GitHub 배포 지침

## 1. 프로젝트 개요 및 디렉토리 구조

React + TypeScript + Vite로 화면을 구성하고, IndexedDB에 기기 메모와 계정별 초안을 보관합니다. 계정 메모는 Supabase의 소유권 검사·서버 버전 비교 API를 사용합니다.

| 경로 | 역할 |
|---|---|
| `src/App.tsx`, `Auth.tsx`, `Modal.tsx` | 목록·편집·인증·설정 화면 |
| `src/store.ts`, `storage.ts`, `cloud.ts` | 순차 저장·로컬 초안·서버 접근 |
| `src/model.ts`, `config.ts` | 데이터 검증·환경설정 |
| `src/style.css` | 모바일·데스크톱·다크 모드 |
| `public/` | 앱 아이콘·설치 manifest |
| `scripts/sw-build.mjs` | 버전별 앱 셸 캐시 생성 |
| `supabase/schema.sql` | 신규 메모 테이블·권한·서버 API |
| `supabase/functions/memo-delete-account/index.ts` | 계정 삭제 함수 소스, **미배포** |
| `tests/` | 입력·복원·정렬·지연 응답 회귀 검사 |
| `docs/` | 배포·운영·검증 문서 |
| `.env.example`, `.gitignore`, `package-lock.json` | 재현 가능한 설치와 비밀정보 제외 |
| `.openai/hosting.json` | 비공개 Sites 배포 식별자 |

## 2. 필수 설정 파일

`.gitignore`는 `node_modules`, `.env*`(예시 제외), 빌드 파일, 로그, OS 임시파일을 제외합니다. 의존성은 `package.json`과 `package-lock.json`에 고정되어 있습니다.

```bash
cp .env.example .env.local
npm ci
```

`.env.local`에 Supabase URL과 **publishable key만** 입력합니다. `VITE_` 값은 빌드 결과에서 공개됩니다. 관리자 secret/service_role 키, SMTP 비밀번호는 절대로 넣지 마세요. 공개 회원가입 검증 전 `VITE_PUBLIC_SIGNUP_READY=false`를 유지합니다.

## 3. 핵심 소스 코드

실행 가능한 전체 코드는 `src/`, SQL은 `supabase/schema.sql`에 있습니다. 기존 `public.memos` 테이블은 수정하지 않았습니다. 새 API는 `memo_notes`를 사용합니다. 관리자 계정 삭제 함수는 승인 검토에 의해 배포되지 않았고 앱에서도 비활성화되어 있습니다. 운영자 승인을 받은 이후 별도 보안·통합 테스트가 필요합니다.

## 4. README

프로젝트 소개, 기능, 설치, 스택, 한계와 실행 URL은 상위 `README.md`에 정리했습니다. 검증 결과는 `TEST_RESULTS.md`, 운영 절차는 `OPERATIONS.md`를 참고하세요.

## 5. Git 초기화 및 업로드

이번 작업은 기존 `blacksally-high/Example`의 `simple-memo/` 폴더에 추가하며 다른 프로그램을 삭제하지 않습니다. 새 독립 저장소가 준비된 경우 다음 명령을 사용합니다.

```bash
git init
git branch -M main
git add .
git commit -m "feat: build mobile memo app with protected autosave"
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY>.git
git push -u origin main
```

기존 Example 저장소에서 수정할 경우:

```bash
git clone https://github.com/blacksally-high/Example.git
cd Example/simple-memo
cp .env.example .env.local
npm ci
npm test
npm run build
cd ..
git add simple-memo .github/workflows/memo-check.yml
git commit -m "feat: add mobile memo app"
git push origin main
```

## 6. 배포 및 자동화

현재 실행 배포는 **소유자 전용 ChatGPT Sites**입니다. 공개 회원가입·인증 메일·운영 정책·계정 삭제 검증이 끝나지 않아 일반 사용자 공개 출시로 간주하지 않습니다.

GitHub의 `memo-check.yml`은 `simple-memo/**` 변경 시 설치, 단위 테스트, 타입 검사와 빌드를 실행합니다. GitHub Variables에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 넣을 수 있습니다. 값이 없으면 기기 모드 빌드만 확인됩니다. 이 워크플로는 공개 배포를 자동 실행하지 않습니다.

### GitHub Pages 검토 결과

기존 Example 저장소의 Pages 워크플로가 `inventory/`를 배포 중입니다. 메모 전용 결과물만 업로드하면 기존 사이트를 지울 수 있어 기존 배포는 변경하지 않았습니다. 공개 출시 조건이 충족되면 기존 `_site`를 구성하는 워크플로에 다음 절차를 통합해야 합니다.

```bash
npm --prefix simple-memo ci
npm --prefix simple-memo test
npm --prefix simple-memo run build
mkdir -p _site/simple-memo
cp -R simple-memo/dist/. _site/simple-memo/
```

기존 `index.html`, `inventory/`와 다른 공개 경로를 유지한 채 하나의 Pages artifact로 배포해야 합니다. `base: './'`, 상대 manifest·서비스 워커 경로를 사용하므로 하위 경로에서도 자산을 찾습니다. Supabase의 실제 Site URL/Redirect URLs에 최종 주소를 추가하고 메일 링크를 검증해야 합니다. 아직 Pages의 메모 앱 배포는 실행하지 않았습니다.

### 배포 되돌리기

Sites에서 직전의 검증된 저장 버전을 재배포합니다. GitHub는 문제가 된 소스 커밋을 `git revert <COMMIT_SHA>` 후 테스트·빌드합니다. 데이터베이스를 되돌리기 위해 `memo_notes`를 삭제하지 마세요. 스키마는 추가형으로 적용되어 이전 앱과 독립적입니다.
