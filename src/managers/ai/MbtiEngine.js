import { calculateDistance } from "../../utils/geometry.js";
import tfLoader from '../../utils/tf-loader.js';
import { ScenarioEngine } from './ScenarioEngine.js';

export class MbtiEngine {
    constructor(eventManager, options = {}) {
        if (!eventManager) {
            throw new Error('MbtiEngine requires an EventManager');
        }
        this.eventManager = eventManager;
        // 판단 빈도가 너무 잦지 않도록 짧은 쿨다운을 둔다
        this.cooldown = 30; // 0.5초 기준 프레임(60fps)

        this.model = null;
        this.modelLoaded = false;
        this.tf = null;
        this.coco = null;
        this.knn = null;
        tfLoader.init().then(() => {
            this.tf = tfLoader.getTf();
            this.coco = tfLoader.cocoSsd;
            this.knn = tfLoader.knnClassifier;
        }).catch(err => {
            console.warn('[MbtiEngine] Failed to initialize TensorFlow libraries:', err);
        });

        this.cooldownCounter = 0;

        if (options.model) {
            this.model = options.model;
            this.modelLoaded = true;
        }
        if (options.modelUrl) {
            this.loadModel(options.modelUrl).catch(err => {
                console.warn('[MbtiEngine] Failed to load model:', err);
            });
        }
        console.log('[MbtiEngine] Initialized with ScenarioEngine');
    }

    async loadModel(url) {
        await tfLoader.init();
        const tf = this.tf || tfLoader.getTf();
        this.model = await tf.loadLayersModel(url);
        this.modelLoaded = true;
        console.log(`[MbtiEngine] Model loaded from ${url}`);
    }

    isReady() {
        if (this.cooldownCounter > 0) {
            this.cooldownCounter--;
            return false;
        }
        return true;
    }

    setCooldown() {
        this.cooldownCounter = this.cooldown;
    }

    buildInput(entity, action, game) {
        // 1. 현재 체력 비율 계산
        const healthPercentage = entity.hp / entity.maxHp;

        // 2. 거리 및 주변 유닛 수 계산을 위한 변수 초기화
        let nearestEnemyDist = Infinity;
        let enemiesInVicinity = 0;
        let alliesInVicinity = 0;
        const VICINITY_RADIUS = 5; // 주변으로 인식할 반경 (5칸)

        // 3. 게임 내 모든 유닛을 순회하며 정보 수집
        for (const other of game.entityManager.entities) {
            if (other.id === entity.id) continue; // 자기 자신은 제외

            const distance = calculateDistance(entity, other);

            if (other.team !== entity.team) { // 적군일 경우
                if (distance < nearestEnemyDist) {
                    nearestEnemyDist = distance;
                }
                if (distance <= VICINITY_RADIUS) {
                    enemiesInVicinity++;
                }
            } else { // 아군일 경우
                if (distance <= VICINITY_RADIUS) {
                    alliesInVicinity++;
                }
            }
        }

        // 거리가 무한대(주변에 적이 없음)일 경우를 처리하고, 값을 정규화 (0~1 사이로)
        const normalizedDistance = nearestEnemyDist === Infinity ? 1.0 : Math.min(1.0, nearestEnemyDist / 20.0);

        // 4. 사용 가능한 스킬 수 계산
        let availableSkillCount = 0;
        if (game.skillManager && entity.skills) {
            availableSkillCount = entity.skills.filter(skill => game.skillManager.isSkillReady(entity, skill.name)).length;
        }

        // 5. 최종적으로 5개의 정보를 담은 배열 생성
        const inputArray = [
            healthPercentage,
            normalizedDistance,
            enemiesInVicinity,
            alliesInVicinity,
            availableSkillCount
        ];

        // 디버깅을 위해 콘솔에 로그 출력
        console.log(`[MbtiEngine] New Input for ${entity.name}:`, inputArray);

        return this.tf.tensor([inputArray]);
    }

    _predictTrait(tensor) {
        const tf = this.tf;
        if (!tf || !this.modelLoaded) return null;
        const prediction = this.model.predict(tensor);
        const traitIndex = prediction.argMax(-1).dataSync()[0];
        tf.dispose([tensor, prediction]);
        const traits = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
        return traits[traitIndex] || null;
    }

    /**
     * 유닛의 행동과 MBTI를 분석하여 특성 발동 이벤트를 발생시킵니다.
     * @param {object} entity - AI 유닛
     * @param {object} action - AI가 결정한 행동
     */
    process(entity, action, game) {
        if (!entity || !action || !entity.properties?.mbti) {
            return;
        }

        if (!this.isReady()) {
            return;
        }

        let traitToPublish = ScenarioEngine.getLabelForScenario(entity, action, game);
        let tfUsed = false;

        if (!traitToPublish && this.tf && this.model) {
            const tensor = this.buildInput(entity, action, game);
            const trait = this._predictTrait(tensor);
            if (trait) {
                this.eventManager.publish('ai_mbti_trait_triggered', { entity, trait, tfUsed: true });
                this.setCooldown();
                return;
            }
        }

        const mbti = entity.properties.mbti;

        switch (action.type) {
            case 'attack':
            case 'skill':
                if (action.target?.isFriendly === false) {
                    if (mbti.includes('T')) traitToPublish = 'T';
                    else if (mbti.includes('F')) traitToPublish = 'F';
                } else if (action.target?.isFriendly === true) {
                    if (mbti.includes('F')) traitToPublish = 'F';
                }
                if (!traitToPublish && mbti.includes('S')) traitToPublish = 'S';
                break;
            case 'move':
                if (action.target) {
                    if (mbti.includes('J')) traitToPublish = 'J';
                } else {
                    if (mbti.includes('P')) traitToPublish = 'P';
                }
                break;
            case 'idle':
            case 'flee':
                if (mbti.includes('I')) traitToPublish = 'I';
                break;
        }

        if (!traitToPublish && action.context?.allies) {
            if (action.context.allies.length > 3 && mbti.includes('E')) {
                traitToPublish = 'E';
            }
        }

        if (traitToPublish) {
            this.eventManager.publish('ai_mbti_trait_triggered', {
                entity,
                trait: traitToPublish,
                tfUsed
            });
            this.setCooldown();
        }
    }
}
