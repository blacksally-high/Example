# 간단 메모장

실행: https://blacsally.github.io/Example/simple-memo/ 에서 이메일·비밀번호로 가입하고 메모를 저장합니다.

검증: Supabase 프로젝트 및 memos 테이블 생성, 본인 데이터 SELECT/INSERT/DELETE RLS 정책과 보안 검사 통과. 공개용 publishable 키만 사용합니다.

미완료: 이메일 확인 비활성화(현재 mailer_autoconfirm=false), 실제 배포 화면의 가입·로그인·저장·새로고침·삭제·재로그인 검증. 이메일 확인 설정은 이 실습 프로젝트에서만 변경해야 합니다.
