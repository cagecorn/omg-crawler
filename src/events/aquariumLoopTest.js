// src/events/aquariumLoopTest.js
// Entry function for 12 vs 12 auto battle test on the Aquarium Loop map.

import { DiceBot } from '../utils/diceBot.js';

export function startAquariumLoopTest(player) {
    console.log('\n' + '='.repeat(50));
    console.log('🔬 [수족관-루프 맵] 테스트 시퀀스를 시작합니다. 🔬');
    console.log('='.repeat(50));

    player.isVisible = false;
    player.isObserver = true;
    console.log('✅ [규칙 4] 플레이어가 관찰자 모드로 전환되었습니다.');

    const diceBot = new DiceBot();

    const playerTeamArea = [50, 100, 350, 500];
    const enemyTeamArea = [450, 100, 750, 500];

    const playerParty = [];
    for (let i = 0; i < 12; i++) {
        playerParty.push(diceBot.createRandomMercenary(`아군용병-${i + 1}`, playerTeamArea));
    }
    console.log('✅ [규칙 1, 2] 12명의 랜덤 아군 용병이 생성 및 배치되었습니다.');

    const enemyParty = [];
    for (let i = 0; i < 12; i++) {
        enemyParty.push(diceBot.createRandomMercenary(`적군용병-${i + 1}`, enemyTeamArea));
    }
    console.log('✅ [규칙 3] 12명의 랜덤 적군 용병이 생성 및 배치되었습니다.');

    console.log('\n--- 생성된 아군 파티 정보 (일부) ---');
    console.log(playerParty[0]);
    console.log('\n--- 생성된 적군 파티 정보 (일부) ---');
    console.log(enemyParty[0]);

    console.log('\n[규칙 5] 모든 준비 완료. 12 vs 12 자동 전투 시뮬레이션을 시작합니다.');
    // TODO: invoke real auto battle logic here
}
