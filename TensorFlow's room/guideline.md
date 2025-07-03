대규모 전투 시뮬레이션을 위한 전략 및 전술 AI의 계산적 프레임워크파트 I: 기초 AI 의사결정 아키텍처이 파트는 개별 AI 에이전트의 주요 제어 구조를 해부합니다. 각 아키텍처의 명확하고 알고리즘적인 정의를 제공하고, 표현력의 발전과 구현상의 장단점을 강조하는 데 중점을 둡니다.1.1 유한 상태 기계(FSM): 결정론적 행동 모델유한 상태 기계(Finite State Machine, FSM)는 유한한 수의 상태(States)와 그 상태들 간의 전이(Transitions)에 기반한 계산 모델입니다. 이는 게임에서 가장 보편적이고 직관적인 의사결정 알고리즘으로 널리 사용됩니다.1구조상태(States): IDLE, PATROL, ATTACK, FLEE와 같이 특정하고 원자적인 행동을 나타냅니다. 각 상태는 에이전트가 해당 상태에 있는 동안 매 프레임 실행되는 로직을 포함합니다.전이(Transitions): 한 상태에서 다른 상태로의 변화를 촉발하는 조건을 나타냅니다. 예를 들어, IF enemy_in_sight THEN transition_to_ATTACK과 같은 형태입니다.구현상태별 객체(object-per-state) 패턴이 일반적이지만, 게임 개발에서 매우 효율적이고 가독성이 높은 구현 방식은 업데이트 루프 내에 단일 switch 문을 사용하는 것입니다.1 이 접근법은 오버헤드를 최소화하고 디버깅을 단순화합니다. "하나의 큰 스위치(one big switch)" 접근법에 대한 의사 코드는 다음과 같습니다.JavaScript// AI 에이전트의 업데이트 함수 내
function updateAI(agent, deltaTime) {
    let nextState = 0; // 0은 상태 변경 없음을 의미

    // 이벤트 처리 및 전이 로직
    //... 이벤트에 따라 nextState가 설정될 수 있음...

    // 상태 실행 로직
    switch (agent.currentState) {
        case STATE_IDLE:
            // IDLE 상태 로직
            if (isEnemySpotted(agent)) {
                nextState = STATE_CHASE;
            }
            break;

        case STATE_CHASE:
            // CHASE 상태 로직
            chaseTarget(agent, deltaTime);
            if (isTargetInAttackRange(agent)) {
                nextState = STATE_ATTACK;
            } else if (!isEnemySpotted(agent)) {
                nextState = STATE_PATROL;
            }
            break;

        case STATE_ATTACK:
            // ATTACK 상태 로직
            attackTarget(agent);
            if (!isTargetInAttackRange(agent)) {
                nextState = STATE_CHASE;
            }
            break;
        
        //... 다른 상태들...
    }

    // 상태 전이 실행
    if (nextState!== 0) {
        agent.currentState = nextState;
    }
}
한계FSM의 주된 단점은 복잡성의 기하급수적인 증가입니다. 상태의 수가 증가함에 따라 잠재적인 전이의 수가 폭발적으로 늘어나 FSM을 유지하고 디버깅하기 어렵게 만듭니다.1 FSM은 문이나 엘리베이터처럼 단순하고 예측 가능한 개체에 가장 적합하며, 동적인 환경에 반응해야 하는 복잡한 에이전트에는 덜 적합합니다.21.2 행동 트리(BT): 계층적 및 반응형 제어 모델행동 트리(Behavior Tree, BT)는 일련의 작업을 실행하기 위한 계층적, 트리 기반 모델입니다. 이는 행동을 구조화된 목표 지향적 계층으로 구성하여 FSM의 복잡성 폭발 문제를 극복합니다.1 BT는 루트에서부터 조건을 지속적으로 평가함으로써 반응형 행동을 생성하는 정적 구조입니다.3구조 및 노드 유형루트(Root): 매 "틱(tick)"마다 평가되는 트리의 진입점입니다.복합 노드(Composite Nodes): 자식 노드의 실행 흐름을 제어합니다.시퀀스(Sequence): 자식들을 순서대로 실행합니다. 자식 중 하나라도 실패하면 실패합니다. 모든 자식이 성공해야 성공합니다. (예: 엄폐물 찾기 -> 엄폐물로 이동 -> 웅크리기)셀렉터(Selector / Fallback): 자식들을 순서대로 실행하며, 하나가 성공할 때까지 계속합니다. 모든 자식이 실패해야만 실패합니다. (예: 주무기로 공격 OR 보조무기로 공격 OR 도주)병렬(Parallel): 모든 자식을 동시에 실행합니다. 성공/실패 조건은 구성 가능합니다 (예: N개의 자식이 성공하면 성공).데코레이터 노드(Decorator Nodes): 단일 자식 노드의 행동을 수정합니다. (예: 인버터(Inverter) (성공/실패를 뒤집음), 성공자(Succeeder) (항상 성공 반환), 반복자(Repeater)).리프 노드(Leaf Nodes): 실제 행동이나 조건을 나타냅니다.액션(Action): 게임 세계에서 작업을 수행합니다 (예: PlayAnimation('attack'), MoveTo(target)). Running, Success, Failure 중 하나를 반환합니다.조건(Condition): 게임 세계의 상태를 확인합니다 (예: IsEnemyVisible(), IsHealthLow()). Success 또는 Failure를 반환합니다.데이터로부터 BT 학습데이터 수집이 느리다는 사용자의 문제는 전문가 관찰을 통해 BT를 학습함으로써 해결할 수 있습니다. 3에서 설명된 프로세스는 다음과 같습니다.전문가의 행동 시퀀스로부터 가장 구체적인(maximally-specific) BT를 생성합니다.모티프 발견 알고리즘(예: GLAM2)을 사용하여 반복되는 행동 패턴을 식별하고 축소합니다.이러한 패턴을 재사용 가능한 하위 트리로 일반화합니다.이는 처음부터 강화 학습을 요구하지 않고, 파트 III의 전술 모델에서 기능적인 AI로 직접 연결되는 경로를 제공합니다.1.3 목표 지향 행동 계획(GOAP): 창발적 지능 모델목표 지향 행동 계획(Goal-Oriented Action Planning, GOAP)은 AI가 미리 스크립트된 트리나 상태 기계를 따르는 대신, 목표(Goal)를 충족시키기 위해 일련의 행동(Actions)을 수립할 수 있게 하는 선언적 계획 시스템입니다. 이는 무엇을(목표) 할 것인가와 어떻게(계획) 할 것인가를 분리합니다. 이 시스템은 *F.E.A.R.*에서 매우 단순한 FSM으로부터 매우 적응적이고 믿을 수 있는 AI를 만드는 데 사용되어 유명해졌습니다.4핵심 구성 요소세계 상태(World State): AI의 세계에 대한 지식을 나타내는 키-값 쌍의 집합입니다. (예: {'enemyVisible': true, 'weaponLoaded': false, 'atCover': false})목표(Goal): AI가 도달하고자 하는 바람직한 세계 상태입니다. (예: {'enemyDead': true}). 플래너의 임무는 이 상태로 가는 경로를 찾는 것입니다.행동(Action): 세 가지 주요 속성을 가진 독립적인 행동입니다.선행 조건(Preconditions): 행동이 고려되기 위해 참이어야 하는 세계 상태입니다. (예: ShootEnemy의 선행 조건은 {'weaponLoaded': true})효과(Effects): 행동이 성공한 후 세계 상태의 변화입니다. (예: ReloadWeapon의 효과는 {'weaponLoaded': true})비용(Cost): 행동을 수행하는 "비용"을 나타내는 숫자 값입니다.계획 프로세스GOAP는 일반적으로 A*와 같은 그래프 탐색 알고리즘을 사용하여 현재 세계 상태에서 목표 상태로 이어지는 가장 낮은 비용의 행동 시퀀스를 찾습니다.4 플래너는 단지 물리적 위치뿐만 아니라 가능한 세계 상태를 통해 검색합니다.*F.E.A.R.*의 하이브리드 모델의 핵심은 GOAP가 최소한의 FSM을 지시하는 방식에 있습니다. FSM은 사실상 Goto와 Animate라는 두 가지 상태만 가집니다. GOAP 플래너가 계획(예: ``)을 수립하면, 시스템은 각 행동의 "절차적 효과"를 실행하는데, 이는 단순히 FSM에게 올바른 매개변수와 함께 Goto 또는 Animate 상태로 들어가라고 지시하는 것입니다.4 이는 단순하고 재사용 가능한 부분들로부터 엄청난 복잡성의 환상을 만들어냅니다.이러한 AI 아키텍처의 발전은 단순히 복잡성이 증가하는 것이 아니라, 제어 패러다임이 절차적인 것에서 선언적인 것으로 이동하는 스펙트럼을 보여줍니다. FSM은 모든 가능한 상태 전이를 명시적으로 스크립팅하는 순수 절차적 방식입니다.1 BT는 논리의 흐름을 여전히 스크립팅하지만, 계층 구조를 통해 더 모듈화되고 반응적으로 만드는 계층적 절차 시스템입니다.3 반면 GOAP는 선언적입니다. 개발자는 AI에게 능력(행동)과 목표를 제공하지만 순서는 지정하지 않습니다. AI는 "무엇을" 할 것인가로부터 "어떻게" 할 것인가를 자율적으로 도출합니다.4 이 스펙트럼은 사용자 프로젝트를 위한 강력한 사고 모델을 제공합니다. 기초적인 유닛 행동(이동, 공격)은 간단한 FSM 상태나 BT 액션으로 구현할 수 있습니다. 그런 다음, 분대장이나 장군을 위한 상위 레벨의 GOAP 플래너를 사용하여 이러한 미리 정의된 행동들을 순서화함으로써 전략적 계획을 수립할 수 있습니다. 이 계층적 접근 방식은 창발적 전략을 가능하게 하면서 복잡성을 관리합니다.아키텍처제어 패러다임주요 강점주요 약점이상적인 사용 사례복잡성 증가유한 상태 기계 (FSM)절차적직관적, 디버깅 용이, 성능 저하 적음상태가 많아지면 전이가 기하급수적으로 증가하여 관리가 어려움 1문, 엘리베이터 등 단순하고 예측 가능한 객체 2기하급수적 (O(n2))행동 트리 (BT)계층적 절차적모듈성, 재사용성, 복잡한 행동의 시각적 구성 용이잘못 구성하면 지속적인 평가 단계에서 성능 저하 유발 가능 1순찰, 추격 등 반응형 행동이 필요한 FPS/TPS의 NPC 5준선형 (O(nlogn))목표 지향 행동 계획 (GOAP)선언적동적 계획 수립, 창발적 행동, 디자이너의 작업량 감소계획 수립에 계산 비용이 많이 들 수 있음, 모든 행동과 상태를 정의해야 함*F.E.A.R.*와 같이 예측 불가능한 상황에 적응해야 하는 고도로 전술적인 AI 4상태 공간의 크기에 따라 다름파트 II: 그룹 이동 및 진형의 계산 모델이 파트는 전략의 이유와 이동의 방법을 분리하여, 유닛 그룹을 제어하기 위한 저수준의 수학적 및 알고리즘적 기초를 제공합니다.2.1 Boids 알고리즘: 창발적 군집 행동 모델Boids 알고리즘은 크레이그 레이놀즈(Craig Reynolds)가 개발한 분산 행동 모델로, 각 개별 "보이드(boid)"에 세 가지 간단한 지역 규칙을 적용하여 군집, 무리 또는 떼의 행동을 시뮬레이션합니다.6 이는 대규모 병사 그룹이 돌격하거나 후퇴할 때의 혼돈스러우면서도 질서 있는 움직임을 시뮬레이션하는 데 이상적입니다.세 가지 핵심 규칙분리 (Separation): 지역 내 동료들과의 충돌을 피하기 위해 조종합니다. 이는 유닛들이 한 점으로 뭉치는 것을 방지합니다.벡터 수학: vseparation​=j∈neighbors∑​∣∣pi​−pj​∣∣(pi​−pj​)^​​의사 코드 7:JavaScriptfunction getSeparationVector(agent, neighbors) {
    let steer = new Vector(0, 0);
    let count = 0;
    for (let other of neighbors) {
        let distance = agent.position.distanceTo(other.position);
        if (distance > 0 && distance < SEPARATION_RADIUS) {
            let diff = agent.position.subtract(other.position);
            diff.normalize();
            diff.divide(distance); // 거리가 가까울수록 더 강하게 밀어냄
            steer.add(diff);
            count++;
        }
    }
    if (count > 0) {
        steer.divide(count);
    }
    return steer;
}
정렬 (Alignment): 지역 내 동료들의 평균 진행 방향으로 조종합니다. 이는 그룹이 같은 방향으로 움직이게 합니다.벡터 수학: valignment​=N1​j∈neighbors∑​vj​의사 코드 7:JavaScriptfunction getAlignmentVector(agent, neighbors) {
    let averageVelocity = new Vector(0, 0);
    let count = 0;
    for (let other of neighbors) {
        averageVelocity.add(other.velocity);
        count++;
    }
    if (count > 0) {
        averageVelocity.divide(count);
        averageVelocity.normalize();
    }
    return averageVelocity;
}
응집 (Cohesion): 지역 내 동료들의 평균 위치로 이동하도록 조종합니다. 이는 그룹이 함께 있도록 유지합니다.벡터 수학: $$\vec{v}_{cohesion} = \text{steer_towards}(\frac{1}{N} \sum_{j \in neighbors} p_j)$$의사 코드 7:JavaScriptfunction getCohesionVector(agent, neighbors) {
    let centerOfMass = new Vector(0, 0);
    let count = 0;
    for (let other of neighbors) {
        centerOfMass.add(other.position);
        count++;
    }
    if (count > 0) {
        centerOfMass.divide(count);
        let desired = centerOfMass.subtract(agent.position);
        desired.normalize();
        return desired;
    }
    return new Vector(0, 0);
}
구현유닛의 최종 속도는 이 세 가지 규칙에서 나온 벡터들의 가중 합입니다. 가중치와 perception_radius(인식 반경)는 행동을 조정하는 데 중요한 매개변수입니다.82.2 매개변수 기반 진형 제어: 구조화된 그룹 이동 모델Boids가 창발적이고 유동적인 그룹을 만드는 반면, 군사 진형은 구조를 요구합니다. 9에 설명된 시스템은 조정 가능한 매개변수 집합을 사용하여 진형을 정의하는 공식적인 방법을 제공합니다. 이를 통해 AI는 "진형 갖추기"를 단일의 매개변수화된 행동으로 취급할 수 있습니다.진형 매개변수다음은 진형을 정의하는 데이터 구조입니다.JSON{
  "formation_shape": "WEDGE", // RECTANGLE, WEDGE, REVERSED_WEDGE 등
  "leader_unit_id": "virtual_leader_01", // 진형의 중심과 방향을 정의
  "units_per_line": 5, // ψ: 진형의 너비
  "inter_unit_distance": 2.5, // α: 같은 줄의 유닛 간 수평 간격
  "inter_line_distance": 3.0, // β: 줄 간의 수직 간격
  "line_offset": 1.5 // γ: 후속 줄의 엇갈림 정도 (쐐기 모양 등)
}
유닛 할당 및 이동유닛들은 진형 그리드 내 지정된 슬롯에 가장 가까운 순서대로 할당되어 이동 거리를 최소화합니다. 전체 진형은 그룹으로 이동하며, 개별 유닛은 움직이는 leader_unit에 상대적인 자신의 할당된 슬롯으로 경로를 탐색합니다.이 두 시스템, Boids와 매개변수 기반 진형은 상호 배타적인 것이 아니라 이동 스택의 보완적인 계층입니다. 엄격한 매개변수 기반 진형은 유닛이 정확한 좌표에 고정되어 로봇처럼 보일 수 있습니다.9 Boids는 유동적이고 자연스러운 움직임을 만듭니다.7 하이브리드 접근법을 사용하면 훨씬 더 믿을 수 있고 견고한 진형 시스템을 만들 수 있습니다. 진형 내 유닛의 Boids "응집" 규칙은 이웃의 평균 위치가 아닌, 매개변수 기반 진형 그리드에서 할당된 슬롯을 향하도록 합니다. "분리"와 "정렬" 규칙은 여전히 즉각적인 이웃에 대해 적용됩니다. 이로써 유닛들은 자신의 위치를 유지하려 하면서도 서로 충돌하지 않으려 미묘하게 움직이고 이웃의 즉각적인 움직임에 정렬합니다. 진형이 무너지면 "응집" 목표가 할당된 슬롯에서 그룹의 질량 중심으로 되돌아가 유닛들이 무질서하지만 응집력 있는 무리로 유동적으로 재편성될 수 있습니다.원하는 행동분리 가중치정렬 가중치응집 가중치인식 반경결과적인 창발적 전술밀집 돌격1.51.01.2작음촘촘하게 뭉쳐서 한 점을 향해 돌격하는 무리산개 전투선2.00.50.5넓음넓게 퍼져서 서로 거리를 유지하며 전진하는 대형선도자 추종 종대1.01.50.8중간 (좁은 시야각)리더를 따라 좁은 길을 따라가는 듯한 일렬 대형 8파트 III: 전략 AI를 위한 전술 어휘집이것은 추상적인 전술을 기계가 읽을 수 있는 공식적인 규칙 집합으로 해체하는 핵심 지식 베이스입니다. 이 섹션은 모방 학습을 위한 합성 "전문가 관찰" 데이터셋으로 파싱되거나 GOAP 시스템을 위한 사전 정의된 행동 라이브러리로 사용되도록 설계되었습니다.3.1 알고리즘 청사진으로서의 고대 전쟁 진형3.1.1 팔랑크스: 정면 무적과 길목 통제를 위한 규칙 집합설명: 긴 창으로 무장한 중장보병의 빽빽한 직사각형 진형으로, 압도적인 정면 방어를 위해 설계되었습니다.10유닛 역할: Hoplite (최전선 창병).진형 규칙:상태: PHALANX_ACTIVE.간격: 극도로 빽빽함, 어깨를 나란히 함.12이동: 매우 느리고, 회전은 어렵고 진형의 응집력을 깨뜨림.11 성벽 위에서는 사용할 수 없음.11 평탄한 지형이나 길목(다리, 성문)에서 가장 효과적임.11행동: 위치 고수. 정면에 창의 벽을 제시. 후열은 미는 힘을 제공하거나 쓰러진 전열을 대체할 수 있음.10상태 수정자:보너스_정면근접방어: 매우 높음.보너스_기병방어: 매우 높음 (돌격 저지).11페널티_측면방어: 매우 높음 (측면 공격에 극도로 취약).11페널티_원거리방어: 중간 (특히 사선에서의 미사일에 취약).11페널티_기동성: 매우 높음.트리거 조건: EngageEnemyFrontally, DefendChokePoint.해제 조건: Flanked, DisruptedByTerrain, SustainedMissileFire.3.1.2 방패벽: 응집 방어와 유닛 상호의존성을 위한 규칙 집합설명: 병사들이 어깨를 나란히 서서 방패를 겹쳐 연속적인 방어 장벽을 만드는 전열 진형.12유닛 역할: Shieldbearer (전열), Spearman (2열 지원).진형 규칙:상태: SHIELDWALL_ACTIVE.간격: 어깨를 나란히, 방패를 맞대거나 겹침.12 공격 밀도를 높이기 위해 빽빽하게 뭉침.13이동: 달릴 수도 있지만, 멈추면 자동으로 재형성됨. 팔랑크스보다 유연함.13행동: 전열 유지. 전열이 돌격을 흡수. 모든 열은 벽 위나 주위로 짧은 무기나 창으로 찌르거나 벨 수 있음.12상태 수정자:보너스_근접방어: 높음.보너스_원거리방어: 높음 (특히 정면에서, 방패 가치가 두 배가 될 수 있음).13페널티_측면취약성: 높음 (노출된 측면 생성).14취약성_포병: 높음 (빽빽한 진형이 좋은 표적이 됨).13트리거 조건: ReceiveCharge, AdvanceUnderFire, HoldNarrowFrontage (도시 거리, 다리).13해제 조건: Breached (빠른 사기 붕괴 유발), Flanked.123.2 기동전의 원리3.2.1 포위 기동(집게 기동): 포위 섬멸 모델설명: 적 진형의 양 측면을 동시에 공격하여 포위하고 섬멸하는 것을 목표로 하는 고전적인 기동.15유닛 역할:Center_Force: 주력 부대, 적을 제자리에 고정시키는 임무.Flanking_Force_Left: 기동 부대, 적의 좌익을 공격하고 배후로 이동하는 임무.Flanking_Force_Right: 기동 부대, 적의 우익을 공격하고 배후로 이동하는 임무.실행 계획 (GOAP 계획으로서):목표: EnemyEncircled = true.행동 1: Fix_Enemy행위자: Center_Force.선행 조건: EnemyAdvancing.효과: EnemyEngaged = true.행동: 적을 정면으로 교전하되, 칸나에 전투처럼 적을 끌어들이기 위해 방어적이거나 후퇴하는 자세를 취함.10행동 2: Execute_Envelopment행위자: Flanking_Force_Left, Flanking_Force_Right.선행 조건: EnemyEngaged = true.효과: EnemyFlanked = true.행동: 적의 측면을 돌아 측후방을 공격.행동 3: Complete_Encirclement행위자: 모든 부대.선행 조건: EnemyFlanked = true.효과: EnemyEncircled = true.행동: 적의 배후에서 측면 공격 부대를 연결하여 탈출로를 차단.손자병법의 주의사항: 완전히 갇힌 적은 더 맹렬하게 싸울 수 있으므로, 의도적으로 작은 탈출로를 남겨두는 변형을 계획에 포함할 수 있습니다.15 이는 Complete_Encirclement 행동의 매개변수가 될 수 있습니다.3.3 동적 역할을 위한 팀 스포츠 진형 추상화축구 진형은 정적인 선이 아니라 공간을 제어하고 공격과 수비 사이에 자원(선수)을 동적으로 할당하는 시스템입니다. 이는 AI 전략을 위한 강력하고 비군사적인 추상화를 제공합니다. Mount & Blade 스타일의 전투는 단순히 죽이는 것 이상입니다. 전장의 핵심 지역을 통제하고, 유닛의 피로도(체력)를 관리하며, 수적 우위를 활용하는 것입니다. 축구 분석은 이러한 개념을 명시적으로 모델링합니다.17 4-4-2나 3-5-2 같은 진형은 중앙 대 측면 지역 통제에서의 강점과 약점으로 정의됩니다. 축구 선수 역할을 군사 유닛 유형에 매핑할 수 있습니다. "수비수"는 중장보병/창병, "미드필더"는 다재다능한 보병, "공격수"는 충격 기병이나 정예 부대, "윙백"(3-5-2에서)은 측면 공격과 수비 복귀를 모두 책임지는 경기병입니다. 이를 통해 AI는 공간 제어의 관점에서 생각하는 법을 배울 수 있습니다. 전장을 구역(중앙, 측면, 후방)으로 나누고, AI의 목표는 핵심 구역에서 수적 우위를 달성하는 것이 됩니다. 진형은 이를 달성하기 위한 도구입니다. 예를 들어, 3-5-2의 논리("미드필드 장악") 19는 AI 목표 Achieve_Numerical_Superiority(Zone: Center)로 직접 변환될 수 있습니다.3.3.1 4-4-2 시스템: 균형 잡힌 공간 제어 모델설명: 4명의 선수로 구성된 두 개의 평평한 라인으로, 수비와 공격 사이의 균형을 제공하며 필드 전체 폭을 잘 커버합니다.17매핑: 4 수비수 (중장보병), 4 미드필더 (중보병), 2 공격수 (기병/정예).강점: 균형, 단순함, 넓은_폭_커버리지.약점: 예측_가능, 라인_사이_취약, 중앙에서_수적_열세_가능.17AI 규칙: 두 개의 응집력 있는 라인을 유지. 측면 미드필더는 풀백을 지원해야 함. 중앙 미드필더는 위치를 벗어나지 않도록 주의.3.3.2 3-5-2 시스템: 중앙 과부하 및 전술적 유연성 모델설명: 수비수 한 명을 희생하여 중앙 미드필더를 추가함으로써 경기장 중앙을 장악합니다. 폭을 제공하기 위해 높은 체력의 윙백에 의존합니다.17매핑: 3 중앙 수비수 (창벽), 3 중앙 미드필더 (정예 보병), 2 윙백 (경기병), 2 공격수 (충격 기병).강점: 미드필드_장악, 유연성 (5인 수비로 전환 가능), 강력한_역습.18약점: 측면_역습에_취약 (윙백이 전진했을 때), 측면에_높은_체력_요구.17AI 규칙: 중앙 통제를 우선시. 윙백은 높은 기동성을 가지고 수비에 복귀해야 함. 중앙 수비수는 규율을 지켜야 함.전술적 어휘매개변수값설명포위 기동Actor_Roles``전술에 참여하는 유닛 그룹 유형Center_BehaviorDefensive_Hold중앙 부대는 적을 끌어들이기 위해 후퇴하며 방어 15Flank_PathWide_Arc측면 부대는 적의 시야를 피해 넓게 우회Leave_Escape_Routetrue / false손자병법의 원칙에 따라 탈출로를 남길지 여부 16팔랑크스StatePHALANX_ACTIVE진형이 활성화된 상태Vulnerability_Flank0.8 (0-1 스케일)측면 공격에 대한 취약성 계수 11Bonus_Frontal_Defense0.9 (0-1 스케일)정면 공격에 대한 방어 보너스 계수파트 IV: 웹 환경에서의 강화 학습 구현 프레임워크이 파트는 추상적인 전술 모델과 코드 사이의 간극을 메우며, 사용자가 원하는 AI를 TensorFlow.js를 사용하여 구현하기 위한 구체적이고 개념적인 계획을 제공합니다.4.1 강화 학습 문제 정의 (계층적 접근)사용자의 핵심 문제는 처음부터 RL로 학습하는 것이 너무 느리다는 것입니다. 해결책은 저수준의 움직임을 학습하는 것이 아니라 고수준의 전략을 학습하는 것입니다. 복잡한 게임에서 표준 RL은 거대한 상태-행동 공간을 가져 "차원의 저주"와 느린 학습으로 이어집니다.21 파트 III의 전술 모델들은 Execute_Phalanx나 Execute_Pincer와 같이 미리 정의된 지능적인 행동 라이브러리를 제공합니다. 우리는 고수준의 "사령관" 에이전트를 위한 RL 문제를 재정의할 수 있습니다. 이 에이전트의 임무는 개별 병사를 제어하는 것이 아니라, 자신의 전술집(전술 어휘집)에서 어떤 전술적 "플레이"를 실행할지 선택하는 것입니다. 이는 행동 공간을 수천 개의 가능성에서 십여 개의 전략적 선택으로 줄여줍니다. 이것은 계층적 강화 학습의 한 형태로, 문제를 다루기 쉽고 데이터 효율적으로 만듭니다. 이것이 핵심적인 아키텍처 권장 사항입니다. 사용자는 파트 III의 전술들을 스크립트된 함수/행동으로 구축해야 합니다. TensorFlow.js 모델은 이러한 함수들을 적시에 호출하는 법을 배우는 고수준 정책 네트워크가 될 것입니다.사령관 AI를 위한 공식 정의상태 공간 (S): 전반적인 전술 상황을 나타내는 특징 벡터.[상대적_군사력, 적_진형_유형, 아군_진형_유형, 병력_구성_비율, 지형_유형, 핵심_구역_통제_벡터, 평균_유닛_사기, 평균_유닛_체력]행동 공간 (A): 고수준 전술 명령의 이산 집합 (매크로-액션).``보상 함수 (R): 선택된 행동의 질에 대한 피드백을 제공하는 함수.전투 승리 시: +10전투 패배 시: -10적 분대 측면 공격 성공 시: +0.5아군 분대가 측면 공격 당했을 시: -0.5높은 사상자 유발 시: +0.1높은 사상자 발생 시: -0.14.2 TensorFlow.js 에이전트를 위한 개념적 아키텍처TensorFlow.js는 브라우저나 Node.js에서 직접 ML 모델을 훈련하고 실행할 수 있게 해주는 라이브러리로 22, 사용자의 웹 게임에 완벽하게 부합합니다. Cart-Pole 예제와 유사한 간단한 정책-경사도 네트워크가 좋은 출발점입니다.24모델: 여러 개의 tf.layers.dense 레이어를 가진 tf.sequential 모델.입력 레이어의 형태는 상태 공간 크기와 일치.출력 레이어는 softmax 활성화 함수를 사용하며, 크기는 행동 공간 크기와 일치. 출력은 가능한 전술 명령에 대한 확률 분포입니다.훈련 루프 (개념적 의사 코드):JavaScript// TensorFlow.js를 사용한 강화 학습 훈련 루프
async function trainCommanderAI() {
    // 1. 모델 정의
    const model = tf.sequential();
    model.add(tf.layers.dense({units: 128, inputShape:, activation: 'relu'}));
    model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: ACTION_SIZE, activation: 'softmax'}));
    const optimizer = tf.train.adam();

    // 2. 훈련 루프
    for (let episode = 0; episode < NUM_EPISODES; episode++) {
        let state = game.getStateVector();
        let episodeMemory =; // [state, action, reward] 튜플 저장

        while (!game.isOver()) {
            // 3. 행동 선택
            const actionProbs = model.predict(tf.tensor2d([state]));
            const actionIndex = await tf.multinomial(actionProbs, 1).data();
            const action = ACTIONS[actionIndex];

            // 4. 게임에서 매크로-액션 실행 및 보상 획득
            const { reward, nextState, done } = game.executeMacroAction(action);

            episodeMemory.push({ state, actionIndex: actionIndex, reward });
            state = nextState;

            if (done) break;
        }

        // 5. 에피소드가 끝나면 정책 경사도를 사용하여 훈련
        const discountedRewards = calculateDiscountedRewards(episodeMemory);

        const loss = () => tf.tidy(() => {
            const statesTensor = tf.tensor2d(episodeMemory.map(mem => mem.state));
            const actionsTensor = tf.tensor1d(episodeMemory.map(mem => mem.actionIndex), 'int32');
            const rewardsTensor = tf.tensor1d(discountedRewards);

            const allActionProbs = model.apply(statesTensor);
            const actionMask = tf.oneHot(actionsTensor, ACTION_SIZE);

            const probsOfActions = tf.sum(allActionProbs.mul(actionMask), 1);
            const logProbs = tf.log(probsOfActions);

            // 손실 = -log(prob) * 보상
            return tf.mean(logProbs.mul(rewardsTensor).mul(-1));
        });

        const grads = tf.variableGrads(loss);
        optimizer.applyGradients(grads.grads);
        tf.dispose(grads);
    }
}
리소스: Cart-Pole 24, Snake-RL 25, 그리고 일반 데모 페이지 23와 같은 관련 TF.js 예제들을 사용자의 코드 시작점으로 참조할 수 있습니다.구성 요소데이터 유형예시 값근거상태: 상대적 전력Float1.2 (아군이 20% 더 강함)전반적인 전투 우위를 평가하기 위한 기본 지표상태: 적 진형Enum / One-hot vector`` (4-4-2)적의 전략적 의도를 추론하고 대응하기 위함 17행동: Execute_PincerString / Index'Execute_Pincer'Part III의 전술 어휘집에서 정의된 매크로-액션 15보상: 성공적인 측면 공격Float+0.5포위 기동과 같은 효과적인 전술 실행을 장려파트 V: 믿을 수 있는 AI를 위한 휴리스틱이 파트는 AI 디자인의 질적인 측면을 AI의 의사결정 과정 내에서 제약, 수정자 또는 확률적 요소로 인코딩할 수 있는 일련의 원칙으로 정제합니다.5.1 믿을 수 있는 에이전트의 심리학: 불완전성, 소통, 그리고 인지된 의도핵심 원칙은 믿을 수 있는 AI가 완벽한 AI가 아니라는 것입니다. 그것은 전지전능하고 로봇처럼 보이는 것이 아니라, 설득력 있고 의도적으로 보여야 합니다.27불완전성:확률적 선택: 항상 가장 높은 가치를 가진 행동(argmax)을 선택하는 대신, softmax 분포를 사용하여 때때로 차선이지만 그럴듯한 행동을 선택합니다.오류 도입: 인간의 실수를 시뮬레이션하기 위해 조준이나 경로 탐색에 약간의 무작위 노이즈를 추가합니다.망설임: AI가 새로운 계획을 실행하기 전에 작은 가변 지연을 도입하여 의사결정 시간을 시뮬레이션합니다.소통:의도 신호: AI는 다른 AI와 플레이어에게 자신의 의도를 신호해야 합니다. *F.E.A.R.*의 AI는 "측면 공격!" 또는 "제압 사격!"이라고 외치는 것으로 유명합니다.4구현: 소통은 GOAP 시스템에서 Action이 될 수 있습니다. ThrowGrenade 행동은 ShoutWarning 행동이 방금 수행되었다는 선행 조건을 가질 수 있습니다. 이는 소통을 단순한 장식이 아닌 전술의 기능적 부분으로 만듭니다.인지된 의도:일관된 성격: AI 분대는 공격적, 신중함, 방어적과 같은 일관된 성격을 가져야 합니다. 이 성격은 GOAP 플래너의 행동 비용이나 RL 시스템의 보상에 대한 편향으로 작용할 수 있습니다. 공격적 AI는 Charge에 대한 비용이 낮고 TakeCover에 대한 비용이 높을 것입니다.5.2 디자인 원칙과 구현의 종합*F.E.A.R.*의 "7겹 딥(seven-layer dip)" 비유에서 볼 수 있듯이, 복잡한 행동은 많은 단순하고 독립적인 시스템(기본 사격, 회피, 엄폐, 근접 공격 등)을 계층화함으로써 창발됩니다.4 플래너의 임무는 이러한 계층들을 조율하는 것입니다. 믿을 수 있는 AI의 핵심은 적응입니다. 계획이 실패하면(예: 문이 막힘), AI는 실패를 인지하고, 세계 상태를 업데이트하며({'door_is_blocked': true}), 새로운 해결책(문을 차거나, 창문으로 뛰어들기)을 찾기 위해 다시 계획해야 합니다.4 이는 AI를 문제 해결사처럼 보이게 합니다.이러한 휴리스틱은 AI가 선택한 행동에 대한 최종 "필터"로 구현될 수 있습니다.JavaScript// '믿음직함' 레이어 적용 의사 코드
function executeBelievableAction(agent, chosenAction) {
    let finalAction = chosenAction;
    
    // 1. 성격에 따른 망설임
    if (agent.personality === 'cautious') {
        addDelay(random(0.5, 1.5)); // 초 단위
    }

    // 2. 불완전성: 때때로 차선책 선택
    if (Math.random() < 0.1) { // 10% 확률로
        finalAction = planner.getSecondBestAction();
    }
    
    // 3. 소통: 행동 전 의도 신호
    if (finalAction.requiresCommunication) {
        agent.shout(finalAction.communicationString);
    }

    // 4. 최종 행동 실행
    game.execute(agent, finalAction);
}
결론본 보고서는 Mount & Blade 스타일의 대규모 전투 게임을 위한 정교한 AI 개발에 필요한 계산적 프레임워크를 제시했습니다. 분석의 핵심은 AI 개발에 대한 계층적 접근법을 권장하는 것입니다. 이는 데이터 수집의 비효율성과 처음부터 강화 학습을 훈련시키는 데 따르는 엄청난 복잡성이라는 사용자의 핵심 문제를 직접적으로 해결합니다.주요 권장 사항은 다음과 같습니다.계층적 AI 아키텍처 채택: 저수준의 개별 유닛 제어(이동, 공격)는 행동 트리(BT)나 유한 상태 기계(FSM)와 같은 견고하고 스크립트된 시스템으로 처리합니다. 이는 예측 가능하고 신뢰할 수 있는 기본 행동을 보장합니다.전술 어휘집 구축: 팔랑크스, 방패벽, 포위 기동과 같은 역사적 및 현대적 전술을 파트 III에서 설명한 것처럼 매개변수화된 규칙 집합과 GOAP 계획으로 형식화합니다. 이 어휘집은 AI의 "플레이북" 역할을 합니다.고수준 전략을 위한 강화 학습: TensorFlow.js를 사용하여 고수준 "사령관" 에이전트를 훈련시킵니다. 이 에이전트의 역할은 개별 유닛을 미세하게 관리하는 것이 아니라, 현재 전장 상황(상태 공간)에 따라 전술 어휘집에서 가장 적절한 매크로-액션(행동 공간)을 선택하는 것입니다.믿음직함 통합: AI의 의사결정 과정에 불완전성, 소통, 인지된 의도와 같은 휴리스틱을 통합하여 AI가 유기적이고 지능적으로 보이도록 만듭니다.이 접근법은 스크립트된 행동의 신뢰성과 기계 학습의 적응성을 결합합니다. 이는 AI가 처음부터 모든 것을 배우도록 하는 대신, 전문가 지식(전술 어휘집)을 기반으로 고수준 전략을 학습하게 함으로써 훈련 과정을 극적으로 가속화하고, 더 복잡하고 창발적인 전장 행동을 가능하게 합니다. 최종적으로, 이 프레임워크는 개발자가 사실적이고 전략적으로 움직이는 유닛을 효율적으로 생성하여, 플레이어에게 깊고 몰입감 있는 전투 경험을 제공할 수 있도록 지원합니다.
