
## 1. 개요 및 핵심 루프 (Overview & Game Loop)

### 1.1. 하이 컨셉 (High Concept)

**"퇴근을 위해 회사라는 던전을 탈출하라!"**

지하 주차장(B6)부터 대표이사실(9F)까지 올라가며 업무 스트레스 괴물들을 처치하는 로그라이트 액션.

- **핵심:** Dead Cells 스타일의 조작감 + 직장 생활 풍자 + 무한 루프(재출근) 엔딩.

### 1.2. 게임 진행 (Flow)

1. **Start:** 지하 6층 차 안에서 기상.
2. **Gameplay:** 층별 탐험 -> 몬스터/중간보스 처치 -> 키카드 획득 -> 엘리베이터 이동.
3. **Result:** 9F 클리어 -> 10F 엔딩(옥상) -> **[결과 화면: 타임어택 등급/S~C]** -> B6F 루프(Reset).
4. **Save:** 층 이동 시 **자동 저장(Auto-save)** (JSON 포맷).

---

## 2. 기술 스택 및 데이터 구조 (Technical Specs)

### 2.1. 개발 환경 (Environment)

- **Engine:** Unity 2022.3 LTS
- **Asset:** **Corgi Engine** (Character Controller, Weapon System 기반)
- **Input:** Unity New Input System

### 2.2. 데이터 관리 (Data Management)

- **Static Data (ScriptableObject):** 무기 정보(`WeaponData`), 층별 테마(`LevelThemeSO`).
- **Save Data (JSON):**JSON

  # 

  `{
    "player": { "currentFloor": "B6", "hp": 100, "gold": 0, "inventory": [] },
    "meta": { "totalPlayTime": 1205, "deathCount": 3, "unlockedItems": [] }
  }`


### 2.3. 클래스 구조 예시 (Class Structure)

- **`GameManager`**: 싱글톤. 전체 게임 상태(State) 및 루프 관리.
- **`LevelManager`**: 층(`CurrentFloor`)에 따라 맵 생성 및 몬스터 스폰 관리.
- **`WeaponController`**: 입력 처리 및 공격 로직. `WeaponData`를 참조하여 스탯 적용.

---

## 3. 레벨 디자인 상세 (Level Design Detail)

각 층은 고유한 **테마(Theme), 컬러코드(Color), 몬스터(Enemy)** 정보를 가집니다. `LevelThemeSO` 데이터 테이블 작성 시 아래 내용을 그대로 사용하십시오.

| **층 (Floor)** | **구역 이름 (Zone)** | **컬러 코드 (Hex)** | **테마 설명** | **주요 몬스터 & 중간 보스 (Mid-Boss)** |
| --- | --- | --- | --- | --- |
| **B6 ~ B2** | **심연 (Parking)** | `#2C3E50` (Dark Gray) | 어두운 주차장, 매연 | **[Mid-Boss] 주차관리 팀장** (호루라기 돌진)
Mob: 세단 미믹, 매연 유령 |
| **B1** | **보급소 (Cafeteria)** | `#E67E22` (Orange) | **Safe Zone**, 상점 | **[Mid-Boss] 앵그리 셰프** (국자 투척)
Mob: 식판 병사 |
| **1F** | **관문 (Lobby)** | `#ECF0F1` (Silver) | 차가운 대리석, 보안 게이트 | **[Mid-Boss] 보안실장** (전면 무적 방패)
Mob: CCTV 비홀더 |
| **2F ~ 3F** | **전시 (Showroom)** | `#1ABC9C` (Cyan) | 유리벽, 회의실 | **[Mid-Boss] PPT 빌런** (레이저 포인터)
Mob: 마네킹, 예스맨 |
| **4F** | **혼돈 (Mobile/UX)** | `#9B59B6` (Purple) | 스마트폰 프레임, 팝톡 | **[Mid-Boss] 가챠 중독자** (랜덤박스 소환)
Mob: 터치 제스처 |
| **5F** | **서버 (Web/Cloud)** | `#2ECC71` (Green) | 전선 덩굴, 데이터 흐름 | **[Mid-Boss] 풀스택 거미** (키보드 4개 사용)
Mob: 버그(Bug) 떼 |
| **6F** | **글리치 (QA/AI)** | `#E74C3C` (Red) | 깨진 화면, 에러 코드 | **[Mid-Boss] 버그 헌터** (잠자리채)
Mob: 도플갱어 |
| **7F** | **확산 (Marketing)** | `#F1C40F` (Gold) | 네온 사인, 확성기 | **[Mid-Boss] 바이럴 확성기** (소음 공격)
Mob: 팝업창 방패병 |
| **8F** | **지원 (Support)** | `#D35400` (Rust) | 낡은 서류, 전화벨 소리 | **[Mid-Boss] 실적 압박맨** (돈다발 기관총)
Mob: 콜센터 히드라 |
| **9F** | **권력 (Executive)** | `#8E44AD` (Burgundy) | 고급 카펫, 클래식 음악 | **[Boss] 대표이사 (CEO)** (3페이즈 변신)
Mob: 인사팀 암살자 |
- **엘리베이터 연출:** 층 이동 시 "어색한 침묵" 텍스트 랜덤 출력 (예: *"오늘 점심 메뉴가 뭐였지..."*).

---

## 4. 무기 시스템 상세 (Weapon System Detail)

주무기는 **'키보드'**이며, 4단계 **등급(Tier)**으로 나뉩니다. `WeaponData` 생성 시 아래 리스트를 구현하십시오.

### 4.1. 무기 데이터 리스트 (Weapon List)

### **[Tier 1: 일반 (Common)]**

- **ID:** `weapon_keyboard_membrane`
- **이름:** **번들 멤브레인 (Basic Membrane)**
- **설명:** "물컹거리는 타건감. 기본 지급품."
- **특징:** 기본 공격 속도, 특수 효과 없음. 타격음(Sound): *틱틱*.
- **ID:** `weapon_keyboard_dusty`
- **이름:** **비품실 굴러다니던 키보드 (Dusty Spare)**
- **설명:** "먼지가 풀풀 날린다."
- **특징:** 공격 시 먼지 이펙트(시야 가림). 타격음: *퍽퍽*.

### **[Tier 2: 희귀 (Rare)]**

- **ID:** `weapon_keyboard_blue`
- **이름:** **PC방 에디션 청축 (Blue Switch)**
- **설명:** "시끄러워서 동료들이 싫어한다."
- **특징:** **[소음공해]** 치명타 확률 15% 증가. 타격음: *찰칵찰칵*.
- **ID:** `weapon_keyboard_red`
- **이름:** **저소음 적축 (Silent Red)**
- **설명:** "몰래 딴짓하기 좋다."
- **특징:** **[암살]** 후방 공격 데미지 150%. 타격음: *서걱서걱*.

### **[Tier 3: 영웅 (Epic)]**

- **ID:** `weapon_keyboard_rgb`
- **이름:** **RGB 게이밍 (RGB Gaming)**
- **설명:** "눈이 부시게 화려하다."
- **특징:** **[LED 잔상]** 공격 궤적에 화염/전기 속성 데미지 장판 생성.
- **ID:** `weapon_keyboard_aluminum`
- **이름:** **풀 알루미늄 커스텀 (Full Aluminum)**
- **설명:** "이건 무기가 아니라 흉기다."
- **특징:** **[통울림]** 공속은 느리지만 슈퍼아머 파괴(Stun). 타격음: *도각도각*.

### **[Tier 4: 전설 (Legendary)]**

- **ID:** `weapon_keyboard_capacitive`
- **이름:** **무접점 끝판왕 (Godly Capacitive)**
- **설명:** "구름을 누르는 기분."
- **특징:** **[염동력]** 원거리 공격 가능 (키보드가 날아갔다 돌아옴).
- **ID:** `weapon_keyboard_split`
- **이름:** **인체공학 스플릿 (Ergo Split)**
- **특징:** **[이도류]** 키보드가 좌우로 분리되어 쌍검처럼 사용. 공속 2배.

### 4.2. 랜덤 옵션 (Affix)

- **Sticky:** 적 이동속도 감소 (커피 쏟음).
- **Wireless:** 투척 스킬 활성화.
- **Macro:** 공격 버튼 유지 시 자동 연타.

---

## 5. UI/UX 시스템 (User Interface)

### 5.1. HUD 구성

- **상단:** 체력바(멘탈 게이지), 버프 아이콘 Grid.
- **우측 상단:** 미니맵, **현재 층(4F)**, **플레이 타임(Time Attack)**.
- **하단:** 소비 아이템 슬롯(Q/E), 보유 골드(야근수당).

### 5.2. 결과 화면 (Result Screen)

- **표시 정보:** 총 소요 시간(Total Time), 사망 횟수.
- **등급 산정 로직:**
    - `Time < 30min`: **S (칼퇴의 신)**
    - `Time < 45min`: **A (모범 사원)**
    - `Time < 60min`: **B (성실 근무자)**
    - `Else`: **C (야근 확정)**

---
