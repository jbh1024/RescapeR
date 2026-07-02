# Asset Layout

이 폴더는 웹 플레이 버전에서 사용하는 아트 에셋을 관리합니다.

## 구조

- `sprites/player/`: 플레이어 스프라이트시트 (스타일 3종 × 13프레임 64×96 + 사망 4프레임)
- `sprites/monsters/`: 일반 몬스터 8종(3프레임 애니메이션) + 층 보스 7종(평상/분노 2프레임)
- `sprites/backgrounds/`: 층 테마 배경 8종 (800×450, 가로 타일링 — 게임에서 2장 이어붙여 무한 스크롤)
- `sprites/tiles/`: 바닥/플랫폼 텍스처 9종 (24×24) + 엘리베이터 게이트
- `sprites/ui/`: 스킬 아이콘 12종, 아이템 아이콘 6종, UI 프레임, 층간 전환 이미지

## 생성 방법 (전량 자체 제작)

모든 스프라이트는 세계관("IT 회사 던전") 기반 픽셀아트로,
`scripts/generate-assets.js`가 **외부 의존성 없이** (Node 내장 zlib PNG 인코딩) 결정적으로 생성합니다.

```bash
# 전체 재생성
node scripts/generate-assets.js all

# 카테고리별 재생성: player | monsters | boss | backgrounds | tiles | ui
node scripts/generate-assets.js player

# 검수용 컨택트시트 출력 (PREVIEW_SCALE 배율 지정 가능)
PREVIEW_SCALE=2 node scripts/generate-assets.js all --preview=/tmp/contact-sheet.png
```

### 스프라이트 규격 (렌더러 계약)

프레임 좌표/크기는 `playable-web/systems/data-config.js`의 `ART_FRAME_SPECS`가 단일 진실 소스입니다.

- 플레이어 시트 프레임 슬롯(64×96 × 13): 0-1 idle / 2-5 walk / 6 jump / 7 fall / 8-9 attack / 10-11 dash / 12 hurt
- 몬스터: 프레임당 64×64 (skull_slime만 64×48), 3프레임 가로 배열
- 보스: `ART_FRAME_SPECS.monsters.boss_*` 크기 × 2프레임 (평상/분노)
- 층 보스 렌더링은 `ZONE_BOSS_IMG` (data-config.js) zone 매핑을 따름

> 과거 사용하던 외부 에셋 팩(Wishforge, platformerGraphicsDeluxe)은 전량 자체 제작 에셋으로 대체되어 저장소에서 제거되었습니다.
