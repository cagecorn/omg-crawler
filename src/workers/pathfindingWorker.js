importScripts('../managers/pathfindingManager.js');

let manager = null;

onmessage = async (e) => {
  const { type, mapData, args } = e.data;
  if (type === 'init') {
    manager = new PathfindingManager(mapData);
  } else if (type === 'find' && manager) {
    const [sx, sy, ex, ey] = args;
    const path = await manager.findPathTensor(sx, sy, ex, ey);
    postMessage(path);
  }
};
