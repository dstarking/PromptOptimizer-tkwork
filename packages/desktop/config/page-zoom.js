const DEFAULT_PAGE_ZOOM_LEVEL = 0;
const PAGE_ZOOM_LEVEL_STEP = 1;
const PAGE_ZOOM_MIN_LEVEL = Math.log(0.5) / Math.log(1.2);
const PAGE_ZOOM_MAX_LEVEL = Math.log(3) / Math.log(1.2);
const VISUAL_ZOOM_LIMITS = Object.freeze({
  minimum: 1,
  maximum: 1,
});

function clampPageZoomLevel(level) {
  return Math.min(PAGE_ZOOM_MAX_LEVEL, Math.max(PAGE_ZOOM_MIN_LEVEL, level));
}

function getNextPageZoomLevel(currentLevel, action) {
  const safeCurrentLevel = Number.isFinite(currentLevel)
    ? currentLevel
    : DEFAULT_PAGE_ZOOM_LEVEL;

  switch (action) {
    case 'zoomIn':
      return clampPageZoomLevel(safeCurrentLevel + PAGE_ZOOM_LEVEL_STEP);
    case 'zoomOut':
      return clampPageZoomLevel(safeCurrentLevel - PAGE_ZOOM_LEVEL_STEP);
    case 'reset':
      return DEFAULT_PAGE_ZOOM_LEVEL;
    default:
      return null;
  }
}

function getPageZoomActionFromDirection(direction) {
  if (direction === 'in') return 'zoomIn';
  if (direction === 'out') return 'zoomOut';
  return null;
}

function applyPageZoomAction(webContents, action) {
  if (
    !webContents ||
    typeof webContents.getZoomLevel !== 'function' ||
    typeof webContents.setZoomLevel !== 'function'
  ) {
    return null;
  }

  const nextLevel = getNextPageZoomLevel(webContents.getZoomLevel(), action);
  if (nextLevel === null) return null;

  webContents.setZoomLevel(nextLevel);
  return nextLevel;
}

module.exports = {
  DEFAULT_PAGE_ZOOM_LEVEL,
  PAGE_ZOOM_MAX_LEVEL,
  PAGE_ZOOM_MIN_LEVEL,
  VISUAL_ZOOM_LIMITS,
  applyPageZoomAction,
  getPageZoomActionFromDirection,
  getNextPageZoomLevel,
};
