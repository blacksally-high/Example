# Example

## 재고온 · 재고관리

소스 코드는 [`inventory/`](./inventory/) 하위 폴더에 있습니다.

- [프로그램 실행](https://blacsally.github.io/Example/inventory/)
- [사용법 및 재고 계산 기준](./inventory/README.md)
- [자동 배포 워크플로](./.github/workflows/inventory-pages.yml)

품목 등록·수정, 입출고, 실사 조정, 안전재고·발주점·ABC·EOQ, CSV 가져오기/내보내기, JSON 백업/복원을 제공합니다. 실제 주문 전송은 하지 않습니다.

이 프로그램은 개인용이며 데이터는 브라우저에 저장됩니다. 다른 주소의 기존 프로그램에서 이전하려면 JSON 백업·복원을 사용하세요.

GitHub Pages에서 최초 실행하려면 Settings → Pages → Source를 GitHub Actions로 설정하고 배포 워크플로가 성공했는지 확인하세요.
