// src/managers/index.js
// 이 파일은 프로젝트의 모든 매니저를 한 곳에서 불러오고, 다시 내보내는 역할을 합니다.

import { MonsterManager } from './monsterManager.js';
import { MercenaryManager } from './mercenaryManager.js';
import { ItemManager } from './itemManager.js';
import { EquipmentManager } from './equipmentManager.js';
import { UIManager } from './uiManager.js';
import { VFXManager } from './vfxManager.js';
import { SkillManager } from './skillManager.js';
import { SoundManager } from './soundManager.js';
import { BgmManager } from './bgmManager.js';
import { EffectManager } from './effectManager.js';
import { ProjectileManager } from './projectileManager.js';
import { ItemAIManager } from './item-ai-manager.js';
import { MotionManager } from './motionManager.js';
import { MovementManager } from './movementManager.js';
import { LaneManager } from './laneManager.js';
import { LaneRenderManager } from './laneRenderManager.js';
import { EquipmentRenderManager } from './equipmentRenderManager.js';
import { ParticleDecoratorManager } from './particleDecoratorManager.js';
import { TraitManager } from './traitManager.js';
import { ParasiteManager } from './parasiteManager.js';
import { StatusEffectsManager } from './statusEffectsManager.js';
import { MicroItemAIManager } from './microItemAIManager.js';
import { EffectIconManager } from './effectIconManager.js';
import { PetManager } from './petManager.js';
import { SquadManager } from './squadManager.js';
import { LaneAssignmentManager } from './laneAssignmentManager.js';
import { FormationManager } from './formationManager.js';
import { EnemyFormationManager } from './enemyFormationManager.js';
import { MetaAIManager } from './metaAIManager.js';
import { AIManager } from './AIManager.js';
import { SynergyManager } from '../micro/SynergyManager.js';
import { SpeechBubbleManager } from './speechBubbleManager.js';
import { AuraManager } from './AuraManager.js';
import { PossessionAIManager } from './possessionAIManager.js';
import { CombatDecisionEngine } from './ai/CombatDecisionEngine.js';
import { ReputationManager } from './ReputationManager.js';
import { EntityManager } from './entityManager.js';
import GuidelineLoader from './guidelineLoader.js';
import { TooltipManager } from './tooltipManager.js';
// DataRecorder is only needed in a Node.js environment so we lazy-load it
let DataRecorder = null;
if (typeof process !== 'undefined' && process.versions?.node) {
    const mod = await import('./dataRecorder.js');
    DataRecorder = mod.DataRecorder;
}
// 파일 기반 로거는 Node 환경 전용이라 기본 묶음에서 제외한다
// import { FileLogManager } from './fileLogManager.js';
// ... (나중에 다른 매니저가 생기면 여기에 추가)

export {
    MonsterManager,
    MercenaryManager,
    ItemManager,
    EquipmentManager,
    UIManager,
    VFXManager,
    SkillManager,
    SoundManager,
    BgmManager,
    EffectManager,
    ProjectileManager,
    ItemAIManager,
    MotionManager,
    MovementManager,
    LaneManager,
    LaneRenderManager,
    EquipmentRenderManager,
    ParticleDecoratorManager,
    TraitManager,
    ParasiteManager,
    MicroItemAIManager,
    PetManager,
    EffectIconManager,
    FormationManager,
    EnemyFormationManager,
    MetaAIManager,
    AIManager,
    PossessionAIManager,
    AuraManager,
    SynergyManager,
    SpeechBubbleManager,
    SquadManager,
    LaneAssignmentManager,
    ReputationManager,
    EntityManager,
    CombatDecisionEngine,
    GuidelineLoader,
    StatusEffectsManager,
    TooltipManager,
    DataRecorder,
};
