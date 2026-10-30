# Example

## 재고온 · 재고관리

소스 코드는 [`inventory/`](./inventory/) 하위 폴더에 있습니다.

- [프로그램 실행](https://blacsally.github.io/Example/inventory/)
- [사용법 및 재고 계산 기준](./inventory/README.md)
- [자동 배포 워크플로](./.github/workflows/inventory-pages.yml)

품목 등록·수정, 입출고, 실사 조정, 안전재고·발주점·ABC·EOQ, CSV 가져오기/내보내기, JSON 백업/복원을 제공합니다. 실제 주문 전송은 하지 않습니다.

이 프로그램은 개인용이며 데이터는 브라우저에 저장됩니다. 다른 주소의 기존 프로그램에서 이전하려면 JSON 백업·복원을 사용하세요.

GitHub Pages에서 최초 실행하려면 Settings → Pages → Source를 GitHub Actions로 설정하고 배포 워크플로가 성공했는지 확인하세요.

## 회의 관리 시스템

소스 코드는 [`meeting-management-system/`](./meeting-management-system/) 하위 폴더에 있습니다.

- [비공개 운영 사이트](https://meeting-control-20261028.blondstone19.chatgpt.site/)
- [설치·실행·배포 안내](./meeting-management-system/README.md)
- [빌드 확인 워크플로](./.github/workflows/meeting-management-check.yml)

회의 기록과 첨부 파일은 서버 저장소에 보관하므로 GitHub Pages에 소스만 올려서는 실행되지 않습니다. 운영 사이트의 접근 권한과 데이터는 이 공개 저장소에 포함되지 않습니다.

## 나의 메모 · 모바일 메모앱

- [소스와 실행 안내](./simple-memo/README.md)
- [비공개 검증 배포](https://sally-my-memo.archiviste-archives.chatgpt.site)
- [검증 결과와 남은 출시 조건](./simple-memo/docs/TEST_RESULTS.md)

자동 저장·검색·고정·휴지통·JSON 백업을 제공하는 모바일 PWA입니다. 인증 메일·계정 삭제·운영 검증이 남아 일반 사용자 공개 출시는 보류되어 있습니다. 기존 GitHub Pages 배포는 변경하지 않았습니다.
