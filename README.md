# 타일 크롤러 (Tile Crawler)

이 프로젝트는 캔버스 렌더링 기반의 실시간 2d 마운트 앤 블레이드 게임입니다. 동료를 고용하며, 아이템을 파밍하고, 다양한 몬스터와 싸우고, 몬스터를 동료로 영입하며 성장합니다.

## 핵심 특징

* **실시간 전투:** 턴제가 아닌, 모든 유닛이 실시간으로 판단하고 행동하는 액션 기반의 전투 시스템을 가집니다.

* **계층형 AI 시스템:** 모든 유닛은 'AI 유형(Archetype)'에 따라 행동하며, '그룹' 단위로 '메타 전략'을 부여받아 유기적으로 움직입니다.
* **데이터 기반 설계:** 아이템, 스킬, 직업 등 대부분의 게임 콘텐츠가 코드와 분리된 데이터 파일로 관리되어 확장과 밸런스 조정이 용이합니다.
* **모듈식 관리자 시스템:** 게임의 각 기능(맵, 몬스터, UI, 이벤트 등)은 독립된 '매니저'가 전담하여, 시스템의 안정성과 유지보수성을 높입니다.
* **새로운 아티팩트 아이콘:** `talisman-1.png`, `talisman-2.png` 파일을 적용하여 부적 아이템의 그래픽을 개선했습니다.
* **쇼크 그레네이드:** 적에게 투척하면 감전 디버프를 부여하는 소모품이 추가되었습니다.
* **부대 전략 선택 UI:** 용병을 부대별로 공격적 또는 방어적으로 배치해 전투 전략을 세밀하게 조정할 수 있습니다.
* **빙의 시스템:** 유령이 몬스터에게 빙의하여 행동을 조종하는 AI가 추가되었습니다.
* **휘장 아이템:** 특수 "휘장" 장비를 장착하면 해당 아이템에 연동된 유령이 등장해 아군이나 몬스터에 빙의하여 전투를 보조합니다.
* **상태이상 시스템 확장:** 수면, 마비, 화상, 출혈, 석화 등 다양한 효과가 전투에 영향을 줍니다.
* **수족관 테스트 맵:** 통로가 넓은 미로 구조로 생성되어 길찾기 실험과 신규 기능 배치를 손쉽게 확인할 수 있습니다.
* **3-Lane 오버레이:** 전장에 세 갈래 길이 표시되어 라인 전투 실험에 활용할 수 있습니다.
* **전투 맵 드래그 지원:** 마우스로 전장을 드래그하여 자유롭게 카메라를 이동할 수 있으며, 키보드를 누르면 다시 플레이어를 따라갑니다.
* **포그 오브 워 토글:** `config/gameSettings.js`의 `ENABLE_FOG_OF_WAR` 값을 통해 안개 효과를 켜거나 끌 수 있습니다. 게임 도중 값을 변경하면 즉시 반영됩니다.
* **TensorFlow 길찾기 토글:** `config/gameSettings.js`의 `ENABLE_TENSORFLOW_PATHING`을 활성화하면 학습된 모델을 이용해 보다 자연스러운 경로를 계산합니다. 기본값은 꺼져 있으며, 모델 파일이 없을 경우 자동으로 기존 BFS 로직을 사용합니다.
* **평판 시스템 토글:** `config/gameSettings.js`의 `ENABLE_REPUTATION_SYSTEM` 값을 false로 설정하면 평판 기록과 모델 로드를 생략하여 성능을 높일 수 있습니다.

## 개발 원칙

* **단일 책임 원칙:** 모든 파일과 클래스는 단 하나의 명확한 책임을 가집니다.
* **관리자 패턴:** 복잡한 로직은 각 '매니저' 클래스가 전담하여 처리합니다.
* **파일 분리 원칙:** 기능별로 파일을 적극적으로 분리하여 코드의 길이를 적절하게 유지합니다.
* **오컴의 면도날:** 무용한 효과나 중복된 행동, 과도한 수치 계산을 미리 걸러내어 가장 단순한 로직으로 운용합니다.

## 마이크로 스모크 테스트
`tests/micro/microSmoke.test.js`에서는 게임의 핵심 로직을 짧게 검증하는 시나리오를 실행합니다. 새 콘텐츠가 추가될 때마다 이 테스트도 함께 업데이트하여 기본 동작을 계속 확인합니다.

## 데이터 무결성 테스트
`tests/unit/dataIntegrity.test.js`에 각 데이터 구조를 검증하는 테스트를 모아 둡니다.
- 모든 스킬은 `manaCost` 속성을 포함해야 합니다.
- 무기 아이템에는 `damageDice`가 반드시 있어야 합니다.
- 스킬과 아이템의 `tags` 배열이 비어 있지 않은지 확인합니다.
새로운 데이터가 추가되면 이 파일에 검증 항목을 계속 추가하세요.

드랍 테이블(`LOOT_DROP_TABLE`)은 `src/data/tables.js`에서 관리합니다. 몬스터별로
다른 드랍 구성을 만들고 싶다면 `getMonsterLootTable` 함수를 수정하세요.

## 통합 테스트 가이드
복잡한 통합 테스트에서 임시 객체를 만들 때는 실제 게임 객체와 동일하게 위치(`x`, `y`), 크기(`width`, `height`), 그리고 `tileSize` 같은 필수 속성을 포함해야 합니다. 이러한 정보가 빠지면 AI 로직이 잘못된 값을 계산하여 테스트가 멈출 수 있습니다.

## 개발 방식
이 프로젝트는 하루 단위의 "Content-First / Smoke-Test-Later" 흐름으로 개발됩니다.

* 새 콘텐츠를 먼저 구현하고 다음 날 스모크 테스트를 통해 문제를 정리합니다.
* 새 콘텐츠가 추가될 때 누락된 연결고리나 오류는 챗GPT 코덱스가 자동으로 보강하며, 한 번 들어온 패치는 필터링해 중복을 방지합니다.
* 이미 구현된 구조에 대해 사용자가 패치를 요구해도 규칙에 따라 자동으로 무시될 수 있습니다.
* 코드 리뷰와 전체 테스트는 주기적으로 수행하여 시스템 안정성을 확보합니다.
* 새로운 패치에 해당하는 png 파일이 있을 경우 챗 지피티 코덱스가 센스있게 적용합니다.

## 엠바고 테스트 운영 지침

* **커다란 패치가 있을 때만** 엠바고 테스트를 실행합니다. 자잘한 패치에서는 생략하며, 무엇이 큰 패치인지는 챗GPT 코덱스가 임의로 판단합니다.
* "커다란 패치"라면 자동으로 엠바고 테스트 항목을 적용합니다.
* 테스트 중에는 체력이 일정 이하로 감소하면 힐 포션을 사용하도록 시나리오를 구성합니다.
* 추후 힐러 용병이 등장해 포션을 쓰지 못하더라도, 힐러가 회복을 마쳤다면 테스트 실패로 보지 않습니다.
* 엠바고 테스트를 실행할 때마다 챗GPT 코덱스가 해당 테스트의 특이사항을 `엠바고-리뷰.md`에 기록합니다.
* 새 패치를 적용하기 전에는 항상 `엠바고-리뷰.md`를 정독해 최신 메모를 확인합니다.
* 2025-06-19 리뷰에는 실제 플레이 관점의 개선점이 기록되어 있으니 전투 연출과 UX 개선에 참고하세요.


## Additional Documentation

For detailed gameplay instructions, see [GAMEPLAY_GUIDE.md](GAMEPLAY_GUIDE.md).
Guidelines for TensorFlow-based pathfinding are available in
[meta-ai-tensorflow-pathing.md](meta-ai-tensorflow-pathing.md).


## TensorFlow.js 연동
`MbtiEngine`은 선택적으로 TensorFlow.js 모델을 로드하여 MBTI 특성 예측에 활용할 수 있습니다.  
패키지는 `@tensorflow/tfjs`에 의존하므로, 프로젝트 루트에서 다음 명령으로 설치하세요:

```bash
npm install
```

모델을 로드하려면 다음과 같이 `MetaAIManager` 초기화 이후 `mbtiEngine.loadModel()`을 호출합니다:

```javascript
// example
await metaAIManager.mbtiEngine.loadModel('models/mbti-model/model.json');
```

게임은 기본적으로 `DataRecorder`를 통해 플레이어의 행동을 실시간으로 수집합니다.
브라우저에서는 `D` 키를 눌러 저장된 데이터를 `training_data.json` 파일로 다운로드할 수 있습니다.

Node 환경에서 직접 파일로 기록하고 싶다면 다음과 같이 초기화합니다:

```javascript
import DataRecorder from './src/managers/dataRecorder.js';
const game = createGame();
const recorder = new DataRecorder(game, './logs/training.jsonl');
await recorder.init();
```

기본 포맷은 JSONL이며 `training.jsonl` 파일에 누적 기록됩니다.

## Guideline Loader
게임 시작 시 `GuidelineLoader`가 지정한 GitHub 경로에서 Markdown 가이드를 읽어
JSON 형식으로 변환합니다. 설정 파일 `config/gameSettings.js`의 `GUIDELINE_REPO_URL`
값을 `user/repo/contents/guidelines?ref=main` 형태로 지정하면 활성화됩니다. 게임을
다시 시작하면 최신 가이드가 자동으로 로드됩니다.


## 결함 주입 테스트
MBTI AI와 힐러 AI의 오류 처리 능력을 확인하는 시나리오가 `tests/unit/faultInjection.test.js`에 있습니다. 버퍼/디버퍼 AI가 추가되면 동일한 파일에서 함께 관리합니다.
이 테스트들은 매 패치마다 돌릴 필요는 없으며, 엠바고 테스트를 실행할 때 같이 수행하는 것을 권장합니다.
자세한 지침은 [FAULT_INJECTION_GUIDE.md](FAULT_INJECTION_GUIDE.md)를 참고하세요.

