const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_PAGE_ZOOM_LEVEL,
  PAGE_ZOOM_MAX_LEVEL,
  PAGE_ZOOM_MIN_LEVEL,
  VISUAL_ZOOM_LIMITS,
  applyPageZoomAction,
  getPageZoomActionFromDirection,
  getNextPageZoomLevel,
} = require('./page-zoom');

test('page zoom level helper moves in, out, and reset actions', () => {
  assert.equal(getNextPageZoomLevel(DEFAULT_PAGE_ZOOM_LEVEL, 'zoomIn'), 1);
  assert.equal(getNextPageZoomLevel(DEFAULT_PAGE_ZOOM_LEVEL, 'zoomOut'), -1);
  assert.equal(getNextPageZoomLevel(2, 'reset'), DEFAULT_PAGE_ZOOM_LEVEL);
});

test('page zoom level helper clamps to Electron zoom bounds', () => {
  assert.equal(getNextPageZoomLevel(PAGE_ZOOM_MAX_LEVEL, 'zoomIn'), PAGE_ZOOM_MAX_LEVEL);
  assert.equal(getNextPageZoomLevel(PAGE_ZOOM_MIN_LEVEL, 'zoomOut'), PAGE_ZOOM_MIN_LEVEL);
});

test('page zoom level helper ignores unknown actions', () => {
  assert.equal(getNextPageZoomLevel(DEFAULT_PAGE_ZOOM_LEVEL, 'noop'), null);
});

test('page zoom direction helper only maps supported wheel directions', () => {
  assert.equal(getPageZoomActionFromDirection('in'), 'zoomIn');
  assert.equal(getPageZoomActionFromDirection('out'), 'zoomOut');
  assert.equal(getPageZoomActionFromDirection('sideways'), null);
});

test('visual zoom limits stay locked to 100 percent to avoid pinch drift', () => {
  assert.deepEqual(VISUAL_ZOOM_LIMITS, { minimum: 1, maximum: 1 });
});

test('page zoom action applies the next level to a webContents-like target', () => {
  const webContents = {
    zoomLevel: DEFAULT_PAGE_ZOOM_LEVEL,
    getZoomLevel() {
      return this.zoomLevel;
    },
    setZoomLevel(nextLevel) {
      this.zoomLevel = nextLevel;
    },
  };

  assert.equal(applyPageZoomAction(webContents, 'zoomIn'), 1);
  assert.equal(webContents.zoomLevel, 1);
  assert.equal(applyPageZoomAction(webContents, 'zoomOut'), DEFAULT_PAGE_ZOOM_LEVEL);
  assert.equal(webContents.zoomLevel, DEFAULT_PAGE_ZOOM_LEVEL);
  assert.equal(applyPageZoomAction(webContents, 'reset'), DEFAULT_PAGE_ZOOM_LEVEL);
});

test('page zoom action leaves unsupported targets unchanged', () => {
  const webContents = {
    getZoomLevel() {
      return DEFAULT_PAGE_ZOOM_LEVEL;
    },
    setZoomLevel() {
      throw new Error('should not be called');
    },
  };

  assert.equal(applyPageZoomAction(webContents, 'noop'), null);
  assert.equal(applyPageZoomAction(null, 'zoomIn'), null);
});
