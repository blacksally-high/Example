# 나의 메모

생각날 때 바로 쓰고, 필요할 때 쉽게 찾는 모바일 메모 PWA.

- 실행 주소: https://sally-my-memo.archiviste-archives.chatgpt.site
- 배포 상태: 소유자 전용 검증 배포. 일반 사용자 공개 출시는 보류.
- GitHub 경로: `blacksally-high/Example/simple-memo`

## 주요 기능

제목 없이 바로 작성, 자동 저장, 검색, 상단 고정, 휴지통·실행 취소·복원·영구 삭제, TXT 내보내기, JSON 전체 백업·복원, 글자 크기, 시스템/밝은/어두운 테마, 설치 안내를 제공합니다.

기기 모드는 IndexedDB에 실제 저장합니다. 계정 모드는 Supabase Auth와 계정별 서버 저장, 버전 비교, 순차 재시도, 충돌 내용 보관 경로를 구현했습니다. 계정 모드의 전체 인증·동기화 검증은 미완료입니다. 기기 모드에서 계정으로 자동 이전하지 않으므로 JSON 내보내기·복원을 사용하세요.

## 설치 및 실행

Node.js 22 이상을 사용하세요.

```bash
npm ci
cp .env.example .env.local
# .env.local에 Supabase URL과 publishable key를 설정
npm run dev
npm test
npm run build
```

빌드 결과는 `dist/`에 생성됩니다. 환경설정 없이 기기 모드로 실행할 수 있습니다. `VITE_` 환경변수는 공개되는 프런트엔드 설정이므로 secret/service_role 키를 넣으면 안 됩니다.

## 기술 스택

React 19, TypeScript 5, Vite 7, Supabase JavaScript SDK, IndexedDB, Service Worker. 버전은 `package-lock.json`으로 고정되어 있습니다.

## 현재 한계

- 공개 회원가입은 비활성화 상태입니다. Supabase의 이메일 확인은 유지합니다. 외부 SMTP 발신·수신 테스트와 인증 리디렉션 설정 검증이 필요합니다.
- 계정 삭제 함수는 자동 승인 검토에서 배포가 거절되어 비활성화되어 있습니다. 코드는 검토용으로만 제공합니다.
- 실제 iPhone/Android, 오프라인 앱 최초 시작, 인증 만료·복구, 실제 다중 계정 API와 다중 기기 통합 테스트는 미실시입니다.
- 운영자 연락처, 실제 백업 주기·보존기간, 격리 환경 복원, 장애 경보 수신자와 비용은 미확정입니다.
- IndexedDB와 브라우저 인증 저장소는 종단간 암호화된 보안 금고가 아닙니다. 민감한 자료를 운영 검증 전 맡기지 마세요.

## 문서

- [6단계 GitHub 배포 지침](docs/DEPLOYMENT.md)
- [운영·백업·복구](docs/OPERATIONS.md)
- [검증 결과와 출시 차단 사항](docs/TEST_RESULTS.md)
- [데이터베이스 스키마](supabase/schema.sql)

## 참고한 공식 문서

- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/reference/javascript/auth-signup
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

확인일: 2026-10-30. 실제 이 프로젝트에서 확인한 사실과 미실시 검증은 검증 결과표에 구분했습니다.
