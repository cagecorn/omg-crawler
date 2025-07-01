// src/utils/diceBot.js
// DiceBot handles all randomness for mercenary generation.

export class DiceBot {
    constructor() {
        // Basic example data; real game should load these externally.
        this.jobs = ['검사', '궁수', '마법사', '성직자', '도적', '기사'];
        this.skills = {
            '검사': ['베기', '강타', '돌진'],
            '궁수': ['조준 사격', '속사', '화살비'],
            '마법사': ['파이어볼', '아이스 스톰', '매직 미사일'],
            '성직자': ['힐', '보호막', '축복'],
            '도적': ['단검 찌르기', '은신', '독 바르기'],
            '기사': ['방패 막기', '성스러운 일격', '도발'],
        };
        this.equipment = ['철검', '가죽 갑옷', '천 로브', '강철 방패'];
        this.consumables = ['회복 물약', '마나 물약'];

        // Rule: exclude the Fire God job entirely from random selection.
        const idx = this.jobs.indexOf('불의 신');
        if (idx !== -1) {
            this.jobs.splice(idx, 1);
        }
        console.log("🎲 DiceBot 준비 완료. '불의 신'은 랜덤 풀에서 제외되었습니다.");
    }

    getRandomJob() {
        return this.jobs[Math.floor(Math.random() * this.jobs.length)];
    }

    getRandomSkills(job, count = 2) {
        const available = this.skills[job] || [];
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, available.length));
    }

    getRandomEquipment() {
        return this.equipment[Math.floor(Math.random() * this.equipment.length)];
    }

    getRandomConsumables(count = 3) {
        const list = [];
        for (let i = 0; i < count; i++) {
            list.push(this.consumables[Math.floor(Math.random() * this.consumables.length)]);
        }
        return list;
    }

    getRandomPosition(area) {
        const [x1, y1, x2, y2] = area;
        const x = Math.floor(Math.random() * (x2 - x1 + 1)) + x1;
        const y = Math.floor(Math.random() * (y2 - y1 + 1)) + y1;
        return { x, y };
    }

    createRandomMercenary(name, area) {
        const job = this.getRandomJob();
        return {
            name: `${name} (${job})`,
            job,
            skills: this.getRandomSkills(job),
            equipment: this.getRandomEquipment(),
            consumables: this.getRandomConsumables(),
            position: this.getRandomPosition(area),
        };
    }
}
