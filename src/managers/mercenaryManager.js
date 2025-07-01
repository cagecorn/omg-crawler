import { TRAITS } from '../data/traits.js';

export class MercenaryManager {
    constructor(eventManager = null, assets = null, factory = null) {
        this.eventManager = eventManager;
        this.assets = assets;
        this.factory = factory;
        this.mercenaries = [];
        this.equipmentRenderManager = null;
        this.traitManager = null;
        this.uiManager = null;
        console.log("[MercenaryManager] Initialized");

        if (this.eventManager) {
            this.eventManager.subscribe('entity_removed', (data) => {
                this.mercenaries = this.mercenaries.filter(m => m.id !== data.victimId);
            });
        }
    }

    setTraitManager(traitManager) {
        this.traitManager = traitManager;
    }

    hireMercenary(jobId, x, y, tileSize, groupId) {
        if (!this.factory || !this.assets) {
            return null;
        }
        const imageKey = this.assets[jobId] ? jobId : 'mercenary';
        const merc = this.factory.create('mercenary', {
            x,
            y,
            tileSize,
            groupId,
            jobId,
            image: this.assets[imageKey],
        });
        if (merc) {
            if (this.equipmentRenderManager) {
                merc.equipmentRenderManager = this.equipmentRenderManager;
            }
            if (this.traitManager) {
                this.traitManager.applyTraits(merc, TRAITS);
            }
            this.mercenaries.push(merc);
        }
        return merc;
    }

    render(ctx) {
        for (const merc of this.mercenaries) {
            if (merc.render) merc.render(ctx);
        }
    }

    getMercenaries() {
        return this.mercenaries;
    }

    // 현재 고용된 모든 용병의 목록을 반환합니다.
    getHiredMercenaries() {
        return this.mercenaries;
    }

    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }

    showMercenaryDetail(mercenary) {
        if (this.uiManager && this.uiManager.showCharacterSheet) {
            this.uiManager.showCharacterSheet(mercenary);
        }
    }

    hideMercenaryDetail(mercId) {
        if (this.uiManager && this.uiManager.hideCharacterSheet) {
            this.uiManager.hideCharacterSheet(mercId);
        }
    }
}
