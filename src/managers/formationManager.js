export class FormationManager {
    constructor(rows = 5, cols = 5, tileSize = 192, orientation = 'LEFT', rotation = 0) {
        // sanitize parameters to avoid invalid array length errors
        this.rows = Math.max(1, Math.floor(Number(rows) || 5));
        this.cols = Math.max(1, Math.floor(Number(cols) || 5));
        this.tileSize = tileSize;
        this.orientation = orientation; // LEFT or RIGHT
        this.rotation = rotation; // radian angle to rotate grid positions
        this.slots = Array.from({ length: this.rows * this.cols }, () => new Set());
    }

    resize(rows, cols) {
        this.rows = Math.max(1, Math.floor(Number(rows) || this.rows));
        this.cols = Math.max(1, Math.floor(Number(cols) || this.cols));
        this.slots = Array.from({ length: this.rows * this.cols }, () => new Set());
    }

    assign(slotIndex, entityId) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return;
        this.slots.forEach(set => set.delete(entityId));
        this.slots[slotIndex].add(entityId);
    }

    findSlotIndex(entityId) {
        return this.slots.findIndex(set => set.has(entityId));
    }

    getSlotPosition(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            return { x: 0, y: 0 };
        }
        const row = Math.floor(slotIndex / this.cols);
        const col = slotIndex % this.cols;

        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        // orientation에 따라 x 좌표가 시각적으로 보이는 방향과 일치하도록 조정
        let orientedCol = this.orientation === 'RIGHT' ? (this.cols - 1 - col) : col;

        const relativeX = (orientedCol - centerCol) * this.tileSize;
        const relativeY = (row - centerRow) * this.tileSize;

        // 회전 변환을 적용
        const cosR = Math.cos(this.rotation);
        const sinR = Math.sin(this.rotation);
        const rotatedX = relativeX * cosR - relativeY * sinR;
        const rotatedY = relativeX * sinR + relativeY * cosR;

        return { x: rotatedX, y: rotatedY };
    }

    apply(origin, entityMap) {
        this.slots.forEach((set, idx) => {
            if (!set) return;
            const off = this.getSlotPosition(idx);
            set.forEach(id => {
                const ent = entityMap[id];
                if (ent) {
                    ent.x = origin.x + off.x;
                    ent.y = origin.y + off.y;
                }
            });
        });
    }
}

