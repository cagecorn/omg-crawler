/**
 * Convert unit entities to plain objects that can be safely
 * transferred to a Web Worker via postMessage.
 *
 * @param {Array<Object>} unitList - array of in-game unit objects
 * @returns {Array<{x:number,y:number,job:string}>}
 */
export function serializeUnits(unitList) {
    if (!Array.isArray(unitList)) return [];
    return unitList.map((unit) => ({
        x: unit.x,
        y: unit.y,
        job: unit.job,
    }));
}
