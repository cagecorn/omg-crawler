export function createGridInventory(rows = 4, cols = 4) {
    const slots = Array.from({ length: rows * cols }, () => null);
    const inventory = {
        rows,
        cols,
        slots,
        push(item) {
            const idx = slots.findIndex(s => s === null);
            if (idx === -1) return false;
            slots[idx] = item;
            return true;
        },
        splice(index, deleteCount = 1) {
            const removed = [];
            for (let i = 0; i < deleteCount; i++) {
                removed.push(slots[index + i]);
                slots[index + i] = null;
            }
            return removed;
        },
        find(fn) {
            return slots.find(s => s && fn(s));
        },
        filter(fn) {
            return slots.filter(s => s && fn(s));
        },
        map(fn) {
            return slots.map(fn);
        },
        indexOf(item) {
            return slots.indexOf(item);
        },
        get length() {
            return slots.length;
        },
        toArray() {
            return slots.slice();
        },
        [Symbol.iterator]: function* () {
            for (const item of slots) {
                if (item) yield item;
            }
        }
    };
    return new Proxy(inventory, {
        get(target, prop) {
            if (prop in target) return target[prop];
            if (!isNaN(prop)) return target.slots[prop];
            return undefined;
        },
        set(target, prop, value) {
            if (!isNaN(prop)) {
                target.slots[prop] = value;
                return true;
            }
            target[prop] = value;
            return true;
        }
    });
}
