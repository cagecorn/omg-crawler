import { SKILLS } from '../data/skills.js';
import { MBTI_INFO } from '../data/mbti.js';
import { FAITHS } from '../data/faiths.js';
import { TRAITS } from '../data/traits.js';
import { SYNERGIES } from '../data/synergies.js';
import { ARTIFACTS } from '../data/artifacts.js';
import { memoryDB } from '../persistence/MemoryDB.js';
import { SETTINGS } from '../../config/gameSettings.js';
import { Draggable } from '../utils/Draggable.js';
import { STRATEGY } from './ai-managers.js';

export class UIManager {
    constructor(eventManager = null, getEntityByIdCallback, tooltipManager) {
        this.eventManager = eventManager;
        this.getEntityById = getEntityByIdCallback;
        this.tooltipManager = tooltipManager;
        this.synergyManager = null;
        this.openCharacterSheets = new Map();
        this.levelElement = document.getElementById('ui-player-level');
        this.statPointsElement = document.getElementById('ui-player-statPoints');
        this.movementSpeedElement = document.getElementById('ui-player-movementSpeed');
        this.hpElement = document.getElementById('ui-player-hp');
        this.maxHpElement = document.getElementById('ui-player-maxHp');
        this.attackPowerElement = document.getElementById('ui-player-attackPower');
        this.goldElement = document.getElementById('ui-player-gold');
        this.hpBarFillElement = document.getElementById('ui-hp-bar-fill');
        this.mpElement = document.getElementById('ui-player-mp');
        this.maxMpElement = document.getElementById('ui-player-maxMp');
        this.mpBarFillElement = document.getElementById('ui-mp-bar-fill');
        this.expBarFillElement = document.getElementById('ui-exp-bar-fill');
        this.expTextElement = document.getElementById('ui-exp-text');
        this.inventorySlotsElement = document.getElementById('inventory-slots');
        this.statUpButtonsContainer = document.getElementById('player-stats-container');
        this.skillSlots = Array.from(document.querySelectorAll('#skill-bar .skill-slot'));
        // --- 용병 정보창 요소 추가 ---
        this.mercDetailPanel = document.getElementById('mercenary-detail-panel');
        this.mercDetailName = document.getElementById('merc-detail-name');
        this.mercStatsContainer = document.getElementById('merc-stats-container');
        this.mercInventory = document.getElementById('merc-inventory');
        this.mercEquipment = document.getElementById('merc-equipment');
        this.mercSkills = document.getElementById('merc-skills');
        this.reputationHistoryPanel = document.getElementById('reputation-history-panel');
        this.closeMercDetailBtn = document.getElementById('close-merc-detail-btn');
        this.mercenaryPanel = document.getElementById('mercenary-panel');
        this.mercenaryList = document.getElementById('mercenary-list');
        this.settings = SETTINGS;
        if (this.reputationHistoryPanel && !this.settings.ENABLE_REPUTATION_SYSTEM) {
            this.reputationHistoryPanel.style.display = 'none';
        }
        // 인벤토리 패널 요소
        this.inventoryPanel = document.getElementById('inventory-panel');
        this.inventoryGrid = document.querySelector('#inventory-panel .inventory-grid');
        this.squadManagementPanel = document.getElementById('squad-management-ui');
        this._squadUIInitialized = false;
        this.formationManager = null;
        this.characterSheetTemplate = document.getElementById('character-sheet-template');
        this.uiContainer = document.getElementById('ui-container');
        // 장비창(캐릭터 시트) 패널 및 현재 표시 중인 캐릭터 ID 기록
        this.characterSheetPanel = document.getElementById('character-sheet-panel');
        this.currentCharacterId = null;
        this.callbacks = {};
        this._lastInventory = [];
        this._lastConsumables = [];
        this._statUpCallback = null;
        this._isInitialized = false;
        this.particleDecoratorManager = null;
        this.vfxManager = null;
        this.getSharedInventory = null;

        this.draggables = [];
        this._initDraggables();

        // 스탯 표시용 이름 매핑
        this.statDisplayNames = {
            strength: '💪 힘',
            agility: '🏃 민첩',
            endurance: '🛡 체력',
            focus: '🔮 집중',
            intelligence: '📖 지능',
            movement: '👣 이동',
            maxHp: '❤️ 최대 HP',
            maxMp: '💧 최대 MP',
            attackPower: '⚔️ 공격력',
            movementSpeed: '🚶 이동 속도',
            hpRegen: '❤️+ HP 재생',
            mpRegen: '💧+ MP 재생',
            visionRange: '👁️ 시야',
            poisonResist: '독 저항',
            freezeResist: '빙결 저항',
            sleepResist: '수면 저항',
            paralysisResist: '마비 저항',
            burnResist: '화상 저항',
            bleedResist: '출혈 저항',
            petrifyResist: '석화 저항',
            silenceResist: '침묵 저항',
            blindResist: '실명 저항',
            fearResist: '공포 저항',
            confusionResist: '혼란 저항',
            charmResist: '매혹 저항',
            movementResist: '이동 방해 저항',
        };
    }

    setSynergyManager(manager) {
        this.synergyManager = manager;
    }

    init(callbacks) {
        if (this._isInitialized) return;
        this.callbacks = callbacks || {};
        this._statUpCallback = this.callbacks.onStatUp;
        this.onEquipItem = this.callbacks.onEquipItem;
        this.onConsumableUse = this.callbacks.onConsumableUse;
        if (this.statUpButtonsContainer) {
            this.statUpButtonsContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('stat-up-btn') ||
                    event.target.classList.contains('stat-plus')) {
                    let stat = event.target.dataset.stat;
                    if (!stat && event.target.id && event.target.id.startsWith('btn-plus-')) {
                        stat = event.target.id.replace('btn-plus-', '');
                    }
                    if (stat && this._statUpCallback) {
                        this._statUpCallback(stat);
                    }
                }
            });
        }
        // 닫기 버튼 이벤트
        if (this.closeMercDetailBtn) {
            this.closeMercDetailBtn.onclick = () => this.hideMercenaryDetail();
        }

        document.querySelectorAll('.close-btn[data-panel-id]').forEach(btn => {
            btn.onclick = () => this.hidePanel(btn.dataset.panelId);
        });

        // 'c' 키를 눌러 캐릭터 시트를 토글하는 로직 추가
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c') {
                if (this.characterSheetPanel.classList.contains('hidden')) {
                    const player = this.game?.player;
                    if (player) {
                        this.displayCharacterSheet(player);
                    }
                } else {
                    this.characterSheetPanel.classList.add('hidden');
                    this.currentCharacterId = null;
                    if (this.gameState) this.gameState.isPaused = false;
                }
            }
        });



        // 기존 단일 캐릭터 시트 탭 로직은 동적 패널 생성 시에 처리됩니다.
        this._isInitialized = true;
    }

    setStatUpCallback(cb) {
        this.init(cb);
    }

    async showMercenaryDetail(mercenary) {
        this.showCharacterSheet(mercenary);
    }


    hideMercenaryDetail() {
        if (this.mercDetailPanel) {
            this.mercDetailPanel.classList.add('hidden');
        }
        if (this.gameState) this.gameState.isPaused = false;
    }


    showPanel(panelId) {
        if ((panelId === 'inventory' || panelId === 'inventory-panel') && this.inventoryPanel) {
            this.inventoryPanel.classList.remove('hidden');
            this.renderSharedInventory();
        } else if (panelId === 'mercenary-panel' && this.mercenaryPanel) {
            this.mercenaryPanel.classList.remove('hidden');
            if (this.mercenaryManager) this.renderMercenaryList();
        } else if (panelId === 'squad-management-ui' && this.squadManagementPanel) {
            this.squadManagementPanel.classList.remove('hidden');
            this.createSquadManagementUI();
        }
    }

    hidePanel(panelId) {
        if ((panelId === 'inventory' || panelId === 'inventory-panel') && this.inventoryPanel) {
            this.inventoryPanel.classList.add('hidden');
        } else if (panelId === 'mercenary-panel' && this.mercenaryPanel) {
            this.mercenaryPanel.classList.add('hidden');
        } else if (panelId === 'squad-management-ui' && this.squadManagementPanel) {
            this.squadManagementPanel.classList.add('hidden');
        }
        if (this.gameState) this.gameState.isPaused = false;
    }

    renderInventory(gameState) {
        const player = gameState.player;
        if (this.equippedItemsContainer) {
            this.equippedItemsContainer.innerHTML = '';
            for (const slot in player.equipment) {
                const item = player.equipment[slot];
                const slotDiv = this.createSlotElement(player, slot, item);
                this.equippedItemsContainer.appendChild(slotDiv);
            }
        }

        if (this.inventoryListContainer) {
            this.inventoryListContainer.innerHTML = '';
            const inv = gameState.inventory;
            for (let i = 0; i < inv.length; i++) {
                const item = inv[i];
                const slotDiv = this.createSlotElement(player, 'inventory', item, i);
                this.inventoryListContainer.appendChild(slotDiv);
            }
        }
    }

    // 공유 인벤토리 패널을 격자 형태로 렌더링합니다.
    renderSharedInventory() {
        const inventoryData = this.getSharedInventory?.();
        if (!inventoryData || !this.inventoryGrid) return;

        const inventoryGrid = this.inventoryGrid;
        inventoryGrid.innerHTML = '';
        inventoryGrid.style.gridTemplateColumns = `repeat(${inventoryData.cols || 10}, 1fr)`;

        for (let i = 0; i < inventoryData.slots.length; i++) {
            const slotEl = document.createElement('div');
            slotEl.classList.add('inventory-slot');
            slotEl.dataset.targetInfo = JSON.stringify({ entityId: 'shared', slot: 'inventory', index: i });

            const item = inventoryData.slots[i];
            if (item) {
                slotEl.dataset.sourceInfo = JSON.stringify({ entityId: 'shared', slot: 'inventory', index: i });
                this.renderItemInSlot(slotEl, item);
            }

            this.setupDropTarget(slotEl);
            inventoryGrid.appendChild(slotEl);
        }
    }

    updateUI(gameState) {
        this.gameState = gameState;
        const player = gameState.player;
        const stats = player.stats;
        if (this.levelElement) this.levelElement.textContent = stats.get('level');
        if (this.statPointsElement) this.statPointsElement.textContent = gameState.statPoints;
        const primaryStats = ['strength', 'agility', 'endurance', 'focus', 'intelligence', 'movement'];
        primaryStats.forEach(stat => {
            const valueElement = document.getElementById(`ui-player-${stat}`);
            const buttonElement = valueElement ? valueElement.nextElementSibling : null;
            if (valueElement) valueElement.textContent = stats.get(stat);
            if (buttonElement) {
                buttonElement.style.display = gameState.statPoints > 0 ? 'inline-block' : 'none';
            }
        });
        if (this.maxHpElement) this.maxHpElement.textContent = stats.get('maxHp');
        const shieldInfo = player.shield > 0 ? `+${player.shield.toFixed(1)}` : '';
        if (this.hpElement) this.hpElement.innerHTML = `${Math.ceil(player.hp)}${shieldInfo ? ` <span style="color:blue">${shieldInfo}</span>` : ''}`;
        if (this.mpElement) this.mpElement.textContent = Math.ceil(player.mp);
        if (this.maxMpElement) this.maxMpElement.textContent = stats.get('maxMp');
        const atkBonus = player.damageBonus || 0;
        if (this.attackPowerElement) {
            const bonusText = atkBonus > 0 ? ` <span style="color:red">+${atkBonus}</span>` : '';
            this.attackPowerElement.innerHTML = `${stats.get('attackPower')}${bonusText}`;
        }
        if (this.movementSpeedElement) this.movementSpeedElement.textContent = stats.get('movementSpeed').toFixed(2);
        if (this.goldElement) this.goldElement.textContent = gameState.gold;
        const hpRatio = player.hp / player.maxHp;
        if (this.hpBarFillElement) this.hpBarFillElement.style.width = `${hpRatio * 100}%`;
        if (this.mpBarFillElement) {
            const mpRatio = player.mp / player.maxMp;
            this.mpBarFillElement.style.width = `${mpRatio * 100}%`;
        }
        const expRatio = stats.get('exp') / stats.get('expNeeded');
        if (this.expBarFillElement) this.expBarFillElement.style.width = `${expRatio * 100}%`;
        if (this.expTextElement) this.expTextElement.textContent = `${stats.get('exp')} / ${stats.get('expNeeded')}`;
        if (this.inventorySlotsElement && this._hasConsumablesChanged(player.consumables)) {
            this.inventorySlotsElement.innerHTML = '';
            (player.consumables || []).forEach((item, index) => {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                if (item.image) {
                    const img = document.createElement('img');
                    img.src = item.image.src;
                    img.alt = item.name;
                    slot.appendChild(img);
                } else {
                    slot.textContent = item.name;
                }
                if (item.quantity > 1) {
                    const qty = document.createElement('span');
                    qty.className = 'item-qty';
                    qty.textContent = item.quantity;
                    slot.appendChild(qty);
                }
                if (this.tooltipManager) {
                    this.tooltipManager.attach(slot, () => this._getItemTooltip(item));
                }
                slot.onclick = () => {
                    if (this.onConsumableUse) this.onConsumableUse(index);
                };
                this.inventorySlotsElement.appendChild(slot);
            });
            this._lastConsumables = [...(player.consumables || [])];
        }

        if (this.skillSlots) {
            this.skillSlots.forEach((slot, idx) => {
                const skillId = player.skills[idx];
                let overlay = slot.querySelector('.skill-cooldown');
                if (skillId) {
                    const skill = SKILLS[skillId];
                    if (skill && skill.icon) {
                        slot.style.backgroundImage = `url(${skill.icon})`;
                        slot.style.backgroundSize = 'cover';
                        slot.style.backgroundPosition = 'center';
                        if (this.tooltipManager) {
                            this.tooltipManager.attach(slot, `<strong>${skill.name}</strong><br>${skill.description}`);
                        }
                    }
                    const cd = player.skillCooldowns[skillId] || 0;
                    if (cd > 0) {
                        if (!overlay) {
                            overlay = document.createElement('div');
                            overlay.className = 'skill-cooldown';
                            slot.appendChild(overlay);
                        }
                        overlay.textContent = Math.ceil(cd / 60);
                    } else if (overlay) {
                        overlay.remove();
                    }
                } else {
                    slot.style.backgroundImage = '';
                    if (overlay) overlay.remove();
                }
            });
        }
    }

    _hasInventoryChanged(current) {
        if (current.length !== this._lastInventory.length) return true;
        for (let i = 0; i < current.length; i++) {
            if (current[i] !== this._lastInventory[i]) return true;
            if (current[i] && this._lastInventory[i] && current[i].quantity !== this._lastInventory[i].quantity) return true;
        }
        return false;
    }

    _hasConsumablesChanged(current) {
        if (current.length !== this._lastConsumables.length) return true;
        for (let i = 0; i < current.length; i++) {
            if (current[i] !== this._lastConsumables[i]) return true;
            if (current[i].quantity !== this._lastConsumables[i].quantity) return true;
        }
        return false;
    }

    useItem(itemIndex, gameState) {
        const item = gameState.inventory[itemIndex];
        if (!item) return;

        if (item.baseId === 'potion' || item.name === 'potion') {
            const player = gameState.player;
            player.hp = Math.min(player.maxHp, player.hp + 5);
            console.log(`포션을 사용했습니다! HP +5`);
            if (this.particleDecoratorManager) {
                this.particleDecoratorManager.playHealingEffect(player);
            }
            if (this.vfxManager) {
                this.vfxManager.addItemUseEffect(player, item.image);
            }
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                gameState.inventory.splice(itemIndex, 1);
            }
            this.updateUI(gameState);
        }
    }

    renderMercenaryList() {
        if (!this.mercenaryList) return;
        this.mercenaryList.innerHTML = '';
        const mercs = this.mercenaryManager ? this.mercenaryManager.mercenaries : [];
        if (mercs.length === 0) {
            this.mercenaryList.textContent = '고용한 용병이 없습니다.';
            return;
        }
        mercs.forEach((merc, idx) => {
            const div = document.createElement('div');
            div.className = 'merc-entry';
            div.textContent = `${idx + 1}. ${merc.constructor.name} (Lv.${merc.stats.get('level')})`;

            // 중앙 관리 함수를 호출하여 마우스 휠 기능이 적용되도록 합니다.
            // 이것이 용병 장비창의 마우스 휠 문제를 해결합니다.
            div.addEventListener('click', () => {
                const mercEntity = this.getEntityById(merc.id);
                if (mercEntity) {
                    this.displayCharacterSheet(mercEntity);
                }
            });

            this.mercenaryList.appendChild(div);
        });
    }

    renderHpBars(ctx, player, monsters, mercenaries) {
        for (const monster of monsters) {
            this._drawHpBar(ctx, monster);
        }
        for (const merc of mercenaries) {
            this._drawHpBar(ctx, merc);
        }
    }

    _drawHpBar(ctx, entity) {
        if (Math.abs(entity.hp - entity.maxHp) < 0.01 || entity.hp <= 0) return;
        const barWidth = entity.width;
        const barHeight = 8;
        const x = entity.x;
        const y = entity.y - barHeight - 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        const hpRatio = entity.hp / entity.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.2 ? '#ffff00' : '#ff0000';
        ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    // 아이템 툴팁 생성 로직 강화
    _getItemTooltip(item) {
        const artifactData = ARTIFACTS[item.baseId];
        let html = `<strong>${item.name}</strong>`;
        
        // 타입과 등급
        html += `<div style="color: #aaa; font-size: 11px;">${item.tier || 'normal'} ${item.type}</div>`;

        // 설명
        if (artifactData && artifactData.description) {
            html += `<div style="margin: 4px 0; color: #b0e0e6;">${artifactData.description}</div>`;
        }

        // 핵심 스탯
        if (item.damageDice) html += `<div>피해: ${item.damageDice}</div>`;
        if (item.healAmount) html += `<div>회복량: ${item.healAmount}</div>`;

        // 추가 스탯
        if (item.stats) {
            const entries = item.stats instanceof Map ? Array.from(item.stats.entries()) : Object.entries(item.stats);
            if(entries.length > 0) {
                html += `<div style="margin-top: 4px; border-top: 1px solid #555; padding-top: 4px;">`;
                for (const [k, v] of entries) {
                    html += `<div>${k}: ${v > 0 ? '+' : ''}${v}</div>`;
                }
                html += `</div>`;
            }
        }
        
        // 미시세계 스탯
        if(item.durability || item.weight || item.toughness) {
             html += `<div style="margin-top: 4px; border-top: 1px solid #555; padding-top: 4px; color: #ccc;">`;
             if(item.durability) html += `<div>내구도: ${item.durability}</div>`;
             if(item.weight) html += `<div>무게: ${item.weight}</div>`;
             if(item.toughness) html += `<div>강인함: ${item.toughness}</div>`;
             html += `</div>`;
        }
        
        // 쿨다운
        if (item.cooldown) {
            html += `<div style="color: #ffcc00;">재사용 대기시간: ${item.cooldown / 60}초</div>`;
        }

        // 시너지
        if (Array.isArray(item.synergies) && item.synergies.length > 0) {
            html += `<div style="margin-top: 4px; border-top: 1px solid #555; padding-top: 4px;"><strong>시너지</strong>`;
            for (const key of item.synergies) {
                const data = SYNERGIES[key];
                if (!data) continue;
                const icon = data.icon ? `${data.icon} ` : '';
                html += `<div style="color: #90ee90;">${icon}${data.name}</div>`;
                if (data.description) {
                    html += `<div style="font-size:11px; color:#ccc;">${data.description}</div>`;
                }
                if (Array.isArray(data.bonuses)) {
                    data.bonuses.forEach(b => {
                        html += `<div style="font-size:11px;">${b.count}개: ${b.description}</div>`;
                    });
                }
            }
            html += `</div>`;
        }

        return html;
    }

    _getMBTITooltip(mbti) {
        const info = MBTI_INFO[mbti] || '';
        const map = {
            E: '버프/회복을 아군에게 집중',
            I: '버프/회복을 자신에게 사용',
            S: '도구와 스킬을 즉시 사용',
            N: '도구와 스킬 사용을 아껴 둠',
            T: '약한 적을 우선 공격',
            F: '아군과 같은 적을 공격',
            P: '적을 보면 돌격',
            J: '거리를 유지하며 전투'
        };
        const behavior = mbti
            .split('')
            .map(l => map[l])
            .filter(Boolean)
            .join(', ');
        return `<strong>${mbti}</strong><br>${info}` +
               (behavior ? `<br><em>AI 경향: ${behavior}</em>` : '');
    }

    _getFaithTooltip(faithId) {
        const data = FAITHS[faithId] || FAITHS.NONE;
        let html = `<strong>${data.name}</strong><br>${data.description}`;
        if (data.statBonuses) {
            const bonusText = Object.entries(data.statBonuses)
                .map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`)
                .join(', ');
            if (bonusText) html += `<br><em>보너스: ${bonusText}</em>`;
        }
        return html;
    }

    _getTraitTooltip(traitId) {
        const data = TRAITS[traitId];
        if (!data) return traitId;
        let html = `<strong>${data.name}</strong>`;
        if (data.description) html += `<br>${data.description}`;
        if (data.stats) {
            const stats = Object.entries(data.stats)
                .map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`)
                .join(', ');
            if (stats) html += `<br><em>${stats}</em>`;
        }
        return html;
    }

    /**
     * Create or update equipment UI for a character.
     * @param {object} character
     */
    createEquipmentUI(character) {
        const container = document.getElementById(`${character.id}-equipment`);
        if (!container) return;
        container.innerHTML = '';
        const slotTypes = ['weapon', 'helmet'];
        slotTypes.forEach(type => {
            const el = this.createSlotElement(character, type, character.equipment[type]);
            container.appendChild(el);
        });
    }

    /**
     * Create or update inventory UI for a character.
     * @param {object} character
     */
    createInventoryUI(character) {
        const container = document.getElementById(`${character.id}-inventory`);
        if (!container) return;
        container.innerHTML = '';
        character.inventory.forEach((item, idx) => {
            const el = this.createSlotElement(character, 'inventory', item, idx);
            container.appendChild(el);
        });
    }

    /**
     * Build a slot element with drag & drop handlers.
     */
    createSlotElement(owner, slotType, item, inventoryIndex = -1) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.ownerId = owner.id;
        slot.dataset.slotType = slotType;
        if (inventoryIndex > -1) slot.dataset.inventoryIndex = inventoryIndex;

        slot.addEventListener('dragover', e => {
            e.preventDefault();
            slot.classList.add('drag-over');
        });
        slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        slot.addEventListener('drop', e => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            try {
                const dropped = JSON.parse(e.dataTransfer.getData('application/json'));
                const from = {
                    entity: this.getEntityById(dropped.from.entityId),
                    slot: dropped.from.slot,
                    index: dropped.from.index
                };
                const to = {
                    entity: owner,
                    slot: slotType,
                    index: inventoryIndex
                };
                this.eventManager?.publish('ui_item_move_request', { from, to });
            } catch (_) {}
        });

        if (item) {
            const img = document.createElement('img');
            img.src = item.iconPath || item.image?.src || '';
            img.draggable = true;
            img.addEventListener('dragstart', e => {
                const fromData = { entityId: owner.id, slot: slotType, index: inventoryIndex };
                e.dataTransfer.setData('application/json', JSON.stringify({ from: fromData }));
                img.classList.add('dragging');
            });
            img.addEventListener('dragend', () => img.classList.remove('dragging'));
            slot.appendChild(img);
            if (item.quantity > 1) {
                const qty = document.createElement('span');
                qty.className = 'item-qty';
                qty.textContent = item.quantity;
                slot.appendChild(qty);
            }
            if (this.tooltipManager) {
                this.tooltipManager.attach(slot, () => this._getItemTooltip(item));
            }

            // 드래그 앤 드롭을 사용하므로 클릭 이벤트는 필요 없습니다.
        }

        return slot;
    }

    _initDraggables() {
        const pairs = [
            [this.mercDetailPanel, this.mercDetailPanel?.querySelector('.window-header')],
            [this.inventoryPanel, this.inventoryPanel?.querySelector('.window-header')],
            [this.mercenaryPanel, this.mercenaryPanel?.querySelector('.window-header')],
            [this.squadManagementPanel, this.squadManagementPanel?.querySelector('.window-header')],
        ];
        pairs.forEach(([panel, header]) => {
            if (panel) {
                panel.classList.add('draggable-window', 'window');
                new Draggable(panel, header || panel);
            }
        });
    }

    // 패널에 드래그 기능을 적용합니다. 이미 적용되어 있더라도 중복 적용을 방지합니다.
    makeDraggable(panel) {
        if (!panel) return;
        if (!panel.classList.contains('draggable-window')) {
            panel.classList.add('draggable-window', 'window');
            new Draggable(panel, panel.querySelector('.window-header') || panel);
        }
    }



    // --- 다중 캐릭터 시트 및 드래그 앤 드롭 지원 메서드들 ---
    showCharacterSheet(entity) {
        if (this.openCharacterSheets.has(entity.id)) {
            const panel = this.openCharacterSheets.get(entity.id);
            panel.style.zIndex = this.getNextZIndex();
            return;
        }

        if (!this.characterSheetTemplate) return;

        const newPanel = this.characterSheetTemplate.cloneNode(true);
        newPanel.id = `character-sheet-${entity.id}`;
        newPanel.classList.remove('hidden', 'template');
        newPanel.style.zIndex = this.getNextZIndex();

        this.uiContainer.appendChild(newPanel);
        this.renderCharacterSheet(entity, newPanel);

        new Draggable(newPanel, newPanel.querySelector('.window-header'));
        this.openCharacterSheets.set(entity.id, newPanel);

        newPanel.querySelector('.close-btn').onclick = () => {
            this.hideCharacterSheet(entity.id);
        };
    }

    hideCharacterSheet(entityId) {
        if (this.openCharacterSheets.has(entityId)) {
            const panel = this.openCharacterSheets.get(entityId);
            panel.remove();
            this.openCharacterSheets.delete(entityId);
        }
        // 모든 캐릭터 시트가 닫히면 게임을 재개한다.
        if (this.openCharacterSheets.size === 0 && this.gameState) {
            this.gameState.isPaused = false;
        }
    }

    // 특정 캐릭터의 장비창을 표시하는 중앙 함수
    displayCharacterSheet(character) {
        if (!character) return;
        if (this.characterSheetPanel && this.characterSheetPanel.children.length === 0 && this.characterSheetTemplate) {
            const temp = this.characterSheetTemplate.cloneNode(true);
            temp.id = '';
            temp.classList.remove('hidden', 'template');
            this.characterSheetPanel.innerHTML = temp.innerHTML;
            const closeBtn = this.characterSheetPanel.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    this.characterSheetPanel.classList.add('hidden');
                    this.currentCharacterId = null;
                    if (this.gameState) this.gameState.isPaused = false;
                };
            }
        }
        this.renderCharacterSheet(character, this.characterSheetPanel);
        // 추가: 장비창이 열릴 때마다 드래그 기능을 확실하게 적용합니다.
        // 이것이 플레이어 장비창 드래그 문제를 해결합니다.
        this.makeDraggable(this.characterSheetPanel);

        this.characterSheetPanel.classList.remove('hidden');
    }

    getNextZIndex() {
        const arr = Array.from(this.openCharacterSheets.values());
        const maxZ = arr.reduce((max, p) => Math.max(max, parseInt(p.style.zIndex || 200)), 200);
        return maxZ + 1;
    }

    renderCharacterSheet(entity, panel) {
        this.currentCharacterId = entity.id; // 현재 표시된 캐릭터 ID 업데이트
        if (!panel) return;
        const nameEl = panel.querySelector('#sheet-character-name');
        if (nameEl) nameEl.textContent = `${entity.name || entity.constructor.name} (Lv.${entity.stats.get('level')})`;

        const equipContainer = panel.querySelector('.sheet-equipment.equipment-slots');
        if (equipContainer) {
            equipContainer.innerHTML = '';
            for (const slotName in entity.equipment) {
                const slotEl = document.createElement('div');
                slotEl.className = 'equip-slot';
                slotEl.dataset.slot = slotName;
                slotEl.dataset.targetInfo = JSON.stringify({ entityId: entity.id, slot: slotName });

                const label = document.createElement('span');
                label.textContent = this.getSlotLabel(slotName);
                slotEl.appendChild(label);

                const item = entity.equipment[slotName];
                if (item) {
                    const sourceInfo = { entityId: entity.id, slot: slotName };
                    slotEl.dataset.sourceInfo = JSON.stringify(sourceInfo);
                    this.renderItemInSlot(slotEl, item);
                }

                this.setupDropTarget(slotEl);
                equipContainer.appendChild(slotEl);
            }
        }

        const synergyBox = panel.querySelector('.sheet-synergies');
        if (synergyBox) {
            synergyBox.innerHTML = '';
            const counts = {};
            for (const slot in entity.equipment) {
                const item = entity.equipment[slot];
                if (item && Array.isArray(item.synergies)) {
                    item.synergies.forEach(k => counts[k] = (counts[k] || 0) + 1);
                }
            }
            for (const key in counts) {
                const data = SYNERGIES[key];
                if (!data) continue;
                const div = document.createElement('div');
                div.className = 'synergy-entry';
                const icon = data.icon ? `${data.icon} ` : '';
                let text = `${icon}${data.name} (${counts[key]})`;
                const active = this.synergyManager?.activeBonuses.get(entity)?.[key];
                if (active) text += ` - ${active.description}`;
                div.textContent = text;
                let tip = `<strong>${data.name}</strong><br>${data.description}`;
                if (Array.isArray(data.bonuses)) {
                    tip += '<br>' + data.bonuses.map(b => `${b.count}개: ${b.description}`).join('<br>');
                }
                if (this.tooltipManager) {
                    this.tooltipManager.attach(div, tip);
                }
                synergyBox.appendChild(div);
            }
        }

        const invBox = panel.querySelector('.sheet-inventory');
        if (invBox) {
            invBox.innerHTML = '';
            (entity.consumables || entity.inventory || []).forEach((item, idx) => {
                const el = document.createElement('div');
                el.className = 'inventory-slot';
                el.dataset.targetInfo = JSON.stringify({ entityId: entity.id, slot: 'inventory', index: idx });
                if (item) {
                    el.dataset.sourceInfo = JSON.stringify({ entityId: entity.id, slot: 'inventory', index: idx });
                    this.renderItemInSlot(el, item);
                }
                this.setupDropTarget(el);
                invBox.appendChild(el);
            });
        }

        const skillBox = panel.querySelector('.sheet-skills');
        if (skillBox) {
            skillBox.innerHTML = '';
            (entity.skills || []).forEach(skillId => {
                const skill = SKILLS[skillId];
                if (!skill) return;
                const div = document.createElement('div');
                div.className = 'skill-slot';
                div.style.backgroundImage = `url(${skill.icon})`;
                div.style.backgroundSize = 'cover';
                if (this.tooltipManager) {
                    this.tooltipManager.attach(div, `<strong>${skill.name}</strong><br>${skill.description}`);
                }
                skillBox.appendChild(div);
            });
        }

        const page1 = panel.querySelector('#stat-page-1');
        if (page1) {
            page1.innerHTML = '';
            const statsToShow = ['strength','agility','endurance','focus','intelligence','movement','maxHp','maxMp','attackPower','movementSpeed','visionRange','hpRegen','mpRegen'];
            statsToShow.forEach(stat => {
                const line = document.createElement('div');
                line.className = 'stat-line';
                const displayName = this.statDisplayNames[stat] || stat;
                if (stat === 'attackPower') {
                    const base = entity.stats.get(stat);
                    const bonus = entity.damageBonus || 0;
                    const bonusText = bonus > 0 ? ` <span style="color:red">+${bonus}</span>` : '';
                    line.innerHTML = `<span>${displayName}:</span> <span>${base}${bonusText}</span>`;
                } else {
                    line.innerHTML = `<span>${displayName}:</span> <span>${entity.stats.get(stat)}</span>`;
                }
                page1.appendChild(line);
            });

            if (entity.effects && entity.effects.length > 0) {
                const effLine = document.createElement('div');
                effLine.className = 'stat-line';
                const list = entity.effects.map(e => `${e.name}(${Math.ceil(e.remaining / 100)}턴)`);
                effLine.textContent = `effects: ${list.join(', ')}`;
                page1.appendChild(effLine);
            }

            if (entity.fullness !== undefined) {
                const fLine = document.createElement('div');
                fLine.className = 'stat-line';
                fLine.innerHTML = `<span>fullness:</span> <span>${entity.fullness.toFixed(1)} / ${entity.maxFullness}</span>`;
                page1.appendChild(fLine);
            }
            if (entity.affinity !== undefined) {
                const aLine = document.createElement('div');
                aLine.className = 'stat-line';
                aLine.innerHTML = `<span>affinity:</span> <span>${entity.affinity.toFixed(1)} / ${entity.maxAffinity}</span>`;
                page1.appendChild(aLine);
            }

            if (entity.properties && entity.properties.mbti) {
                const mLine = document.createElement('div');
                mLine.className = 'stat-line';
                const span = document.createElement('span');
                span.textContent = entity.properties.mbti;
                if (this.tooltipManager) {
                    this.tooltipManager.attach(span, this._getMBTITooltip(entity.properties.mbti));
                }
                mLine.innerHTML = 'MBTI: ';
                mLine.appendChild(span);
                page1.appendChild(mLine);
            }

            if (entity.properties && entity.properties.faith) {
                const fLine2 = document.createElement('div');
                fLine2.className = 'stat-line';
                const span2 = document.createElement('span');
                const fId2 = entity.properties.faith;
                span2.textContent = FAITHS[fId2].name;
                if (this.tooltipManager) {
                    this.tooltipManager.attach(span2, this._getFaithTooltip(fId2));
                }
                fLine2.innerHTML = 'faith: ';
                fLine2.appendChild(span2);
                page1.appendChild(fLine2);
            }

            if (entity.properties && Array.isArray(entity.properties.traits)) {
                const tLine = document.createElement('div');
                tLine.className = 'stat-line';
                tLine.innerHTML = 'traits: ';
                entity.properties.traits.forEach(id => {
                    const span = document.createElement('span');
                    span.textContent = TRAITS[id]?.name || id;
                    if (this.tooltipManager) {
                        this.tooltipManager.attach(span, this._getTraitTooltip(id));
                    }
                    tLine.appendChild(span);
                    tLine.appendChild(document.createTextNode(' '));
                });
                page1.appendChild(tLine);
            }
        }

        const page2 = panel.querySelector('#stat-page-2');
        if (page2) {
            page2.innerHTML = '<h3>무기 숙련도</h3>';
            const proficiencyList = document.createElement('div');
            proficiencyList.className = 'proficiency-list';

            for (const weaponType in entity.proficiency) {
                const prof = entity.proficiency[weaponType];
                const line = document.createElement('div');
                line.className = 'proficiency-line';
                const expRatio = (prof.exp / prof.expNeeded) * 100;
                line.innerHTML = `
                    <span class="prof-name">${weaponType}</span>
                    <span class="prof-level">Lv.${prof.level}</span>
                    <div class="prof-exp-bar-container">
                        <div class="prof-exp-bar-fill" style="width: ${expRatio}%"></div>
                        <span class="prof-exp-text">${prof.exp}/${prof.expNeeded}</span>
                    </div>
                `;
                proficiencyList.appendChild(line);
            }
            page2.appendChild(proficiencyList);

            const resistHeader = document.createElement('h3');
            resistHeader.style.marginTop = '15px';
            resistHeader.textContent = '상태이상 저항';
            page2.appendChild(resistHeader);

            const resistList = document.createElement('div');
            resistList.className = 'proficiency-list';

            const resistStats = [
                'poisonResist', 'freezeResist', 'sleepResist', 'paralysisResist',
                'burnResist', 'bleedResist', 'petrifyResist', 'silenceResist',
                'blindResist', 'fearResist', 'confusionResist', 'charmResist', 'movementResist'
            ];

            resistStats.forEach(stat => {
                const value = entity.stats.get(stat) * 100;
                if (value === 0) return;
                const line = document.createElement('div');
                line.className = 'stat-line';
                const name = this.statDisplayNames[stat] || stat.replace('Resist', '');
                line.innerHTML = `<span>${name}:</span> <span>${value.toFixed(0)}%</span>`;
                resistList.appendChild(line);
            });
            page2.appendChild(resistList);
        }
    }

    // 슬롯에 아이템을 표시하고 드래그 기능을 부여합니다.
    renderItemInSlot(slotEl, item) {
        slotEl.innerHTML = `<img src="${item.iconPath || item.image?.src || ''}" alt="${item.name}">`;
        slotEl.classList.add('has-item');
        slotEl.draggable = true;
        slotEl.ondragstart = (e) => {
            e.dataTransfer.setData('application/json', slotEl.dataset.sourceInfo);
            e.dataTransfer.effectAllowed = 'move';
        };
        slotEl.ondragend = () => {};
        if (this.tooltipManager) {
            this.tooltipManager.attach(slotEl, () => this._getItemTooltip(item));
        }
    }

    setupDropTarget(slotEl) {
        slotEl.ondragover = (e) => {
            e.preventDefault();
            slotEl.classList.add('drag-over');
        };
        slotEl.ondragleave = () => slotEl.classList.remove('drag-over');
        slotEl.ondrop = (e) => {
            e.preventDefault();
            slotEl.classList.remove('drag-over');
            const fromInfo = JSON.parse(e.dataTransfer.getData('application/json'));
            const toInfo = JSON.parse(e.currentTarget.dataset.targetInfo);

            if (!fromInfo || !toInfo) {
                console.error("드래그 앤 드롭 정보가 부족합니다.");
                return;
            }

            this.eventManager.publish('ui_item_move_request', { from: fromInfo, to: toInfo });
        };
    }

    createSquadManagementUI() {
        const container = this.squadManagementPanel;
        if (!container || !this.mercenaryManager) return;
        const content = container.querySelector('.squad-content');
        if (!content) return;
        content.innerHTML = '';

        const squads = [
            { id: 'unassigned', name: '미편성' },
            ...Object.entries(this.squadManager?.getSquads() || {}).map(([id, sq]) => ({
                id,
                name: sq.name,
                strategy: sq.strategy
            }))
        ];

        const panelMap = {};
        squads.forEach(sq => {
            const panel = document.createElement('div');
            panel.className = 'squad-panel';
            panel.dataset.squadId = sq.id === 'unassigned' ? '' : sq.id;
            panel.textContent = sq.name;
            if (sq.id !== 'unassigned') {
                panel.draggable = true;
                panel.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', `squad:${sq.id}`);
                });
            }

            if (sq.id !== 'unassigned') {
                const strategyContainer = document.createElement('div');
                strategyContainer.className = 'strategy-controls';

                const aggressiveBtn = document.createElement('button');
                aggressiveBtn.textContent = '공격적';
                if (sq.strategy === STRATEGY.AGGRESSIVE) aggressiveBtn.classList.add('active');
                aggressiveBtn.onclick = () => {
                    this.eventManager?.publish('squad_strategy_change_request', {
                        squadId: sq.id,
                        newStrategy: STRATEGY.AGGRESSIVE
                    });
                };

                const defensiveBtn = document.createElement('button');
                defensiveBtn.textContent = '방어적';
                if (sq.strategy === STRATEGY.DEFENSIVE) defensiveBtn.classList.add('active');
                defensiveBtn.onclick = () => {
                    this.eventManager?.publish('squad_strategy_change_request', {
                        squadId: sq.id,
                        newStrategy: STRATEGY.DEFENSIVE
                    });
                };

                strategyContainer.appendChild(aggressiveBtn);
                strategyContainer.appendChild(defensiveBtn);
                panel.appendChild(strategyContainer);
            }
            panel.addEventListener('dragover', e => e.preventDefault());
            panel.addEventListener('drop', e => {
                e.preventDefault();
                const mercId = e.dataTransfer.getData('text/plain');
                const toSquadId = panel.dataset.squadId || null;
                this.eventManager?.publish('squad_assign_request', { mercId, toSquadId });
            });
            content.appendChild(panel);
            panelMap[sq.id] = panel;
        });

        this.mercenaryManager.getMercenaries().forEach(merc => {
            const el = document.createElement('div');
            el.className = 'merc-portrait';
            el.textContent = merc.id;
            el.dataset.mercId = merc.id;
            el.draggable = true;
            el.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', merc.id);
            });
            const squadId = merc.squadId || 'unassigned';
            const parent = panelMap[squadId] || content;
            parent.appendChild(el);
        });

        const grid = document.getElementById('formation-grid');
        if (grid && this.formationManager) {
            grid.innerHTML = '';

            const rows = this.formationManager.rows;
            const cols = this.formationManager.cols;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const idx = r * cols + c;
                    const ids = Array.from(this.formationManager.slots[idx] || []);

                    const cell = document.createElement('div');
                    cell.className = 'formation-cell';
                    cell.dataset.index = idx;

                    if (ids.length > 0) {
                        ids.forEach(id => {
                            const entity = this.getEntityById(id);
                            if (entity) {
                                const portrait = document.createElement('div');
                                portrait.className = 'merc-portrait';
                                portrait.textContent = entity.name || entity.constructor.name.substring(0, 4);
                                portrait.draggable = true;
                                portrait.dataset.entityId = id;
                                portrait.addEventListener('dragstart', e => {
                                    e.dataTransfer.setData('text/plain', `entity:${id}`);
                                });
                                cell.appendChild(portrait);
                            }
                        });
                    } else {
                        cell.textContent = idx + 1;
                    }

                    cell.addEventListener('dragover', e => e.preventDefault());
                    cell.addEventListener('drop', e => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData('text/plain');
                        const targetIndex = parseInt(cell.dataset.index, 10);

                        if (data.startsWith('squad:')) {
                            const squadId = data.split(':')[1];
                            this.eventManager?.publish('formation_assign_request', { squadId, slotIndex: targetIndex });
                        } else if (data.startsWith('entity:')) {
                            const entityId = data.split(':')[1];
                            this.eventManager?.publish('formation_assign_request', { entityId, slotIndex: targetIndex });
                        }
                    });
                    grid.appendChild(cell);
                }
            }
        }

        const confirmBtn = container.querySelector('#confirm-formation-btn');
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                this.eventManager?.publish('formation_confirmed');
                this.hidePanel('squad-management-ui');
            };
        }

        if (!this._squadUIInitialized) {
            this.eventManager?.subscribe('squad_data_changed', () => this.createSquadManagementUI());
            this._squadUIInitialized = true;
        }
    }

    updateCharacterSheet(entityId) {
        if (this.openCharacterSheets.has(entityId)) {
            const panel = this.openCharacterSheets.get(entityId);
            const entity = this.getEntityById(entityId);
            if (entity && panel) {
                this.renderCharacterSheet(entity, panel);
            }
        }
    }

    getSlotLabel(slotName) {
        const labels = {
            main_hand: '주무기',
            off_hand: '보조장비',
            armor: '갑옷',
            helmet: '투구',
            gloves: '장갑',
            boots: '신발',
            accessory1: '장신구1',
            accessory2: '장신구2'
        };
        return labels[slotName] || slotName;
    }
}
