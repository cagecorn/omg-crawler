export const JOBS = {
    warrior: {
        name: '전사',
        description: '강인한 체력과 근접 전투 능력의 전문가입니다.',
        stats: {
            strength: 8,
            agility: 4,
            endurance: 6,
            // 묵직한 갑옷으로 인해 다소 느리다
            movement: 3,
            hp: 40,
            attackPower: 17,
        }
    },
    archer: {
        name: '궁수',
        description: '원거리에서 활을 다루는 전문가입니다.',
        stats: {
            strength: 5,
            agility: 8,
            endurance: 4,
            // 가벼운 몸놀림을 살려 빠르게 이동한다
            movement: 5,
            hp: 30,
            attackPower: 15,
        }
    },
    healer: {
        name: '힐러',
        description: '아군을 치유하고 지원하는 전문가입니다.',
        stats: {
            strength: 3,
            agility: 5,
            endurance: 4,
            focus: 8,
            movement: 4,
            hp: 28,
            attackPower: 10,
        }
    },
    wizard: {
        name: '마법사',
        description: '원소 마법으로 적을 제압하는 전문가입니다.',
        stats: {
            strength: 2,
            agility: 4,
            endurance: 3,
            focus: 9,
            intelligence: 8,
            // 무거운 로브 때문에 약간 둔하다
            movement: 3,
            hp: 24,
            attackPower: 12,
        }
    },
    summoner: {
        name: '소환사',
        description: '하수인을 소환해 전투를 지원하는 전문가입니다.',
        stats: {
            strength: 2,
            agility: 3,
            endurance: 3,
            focus: 10,
            intelligence: 9,
            // 의식을 준비하느라 움직임이 느리다
            movement: 3,
            hp: 22,
            attackPower: 11,
        }
    },
    bard: {
        name: '음유시인',
        description: '연주로 아군을 지원하는 전문가입니다.',
        stats: {
            strength: 3,
            agility: 6,
            endurance: 4,
            focus: 8,
            // 악기를 들고도 민첩하게 움직인다
            movement: 5,
            hp: 26,
            attackPower: 10,
        }
    },
    fire_god: {
        name: '불의 신',
        description: '화염을 다루는 강력한 존재입니다.',
        stats: {
            strength: 12,
            agility: 8,
            endurance: 12,
            focus: 10,
            intelligence: 10,
            // 신답게 빠른 기동력을 지닌다
            movement: 6,
            hp: 80,
            attackPower: 35,
            sizeInTiles_w: 2,
            sizeInTiles_h: 2,
        }
    },
};

