const test = require('node:test');
const assert = require('node:assert/strict');
const { createElectronImageInputConverter } = require('./image-input-normalizer');

function createNativeImageMock({ width, height, jpegBytes = 32, pngBytes = 32 }) {
  const calls = { resize: [], jpeg: [], png: 0 };
  const resizedImage = {
    toJPEG(quality) {
      calls.jpeg.push(quality);
      return Buffer.alloc(jpegBytes, 1);
    },
    toPNG() {
      calls.png += 1;
      return Buffer.alloc(pngBytes, 2);
    },
  };
  const image = {
    isEmpty: () => false,
    getSize: () => ({ width, height }),
    resize(options) {
      calls.resize.push(options);
      return resizedImage;
    },
    ...resizedImage,
  };
  return {
    nativeImage: { createFromDataURL: () => image },
    calls,
  };
}

test('keeps a compatible JPEG as JPEG without re-encoding it', async () => {
  const { nativeImage, calls } = createNativeImageMock({ width: 1200, height: 800 });
  const convert = createElectronImageInputConverter(nativeImage);
  const input = { b64: Buffer.from('jpeg').toString('base64'), mimeType: 'image/jpeg' };

  const result = await convert(input);

  assert.deepEqual(result, input);
  assert.equal(calls.jpeg.length, 0);
  assert.equal(calls.png, 0);
})

test('resizes an oversized JPEG and preserves its MIME type', async () => {
  const { nativeImage, calls } = createNativeImageMock({ width: 6000, height: 3000 });
  const convert = createElectronImageInputConverter(nativeImage);

  const result = await convert({
    b64: Buffer.from('jpeg').toString('base64'),
    mimeType: 'image/jpg',
  });

  assert.equal(result.mimeType, 'image/jpeg');
  assert.equal(calls.resize.length, 1);
  assert.deepEqual(calls.resize[0], { width: 4096, height: 2048, quality: 'best' });
  assert.deepEqual(calls.jpeg, [90]);
  assert.equal(calls.png, 0);
})

test('keeps PNG output on the lossless PNG path', async () => {
  const { nativeImage, calls } = createNativeImageMock({ width: 6000, height: 3000 });
  const convert = createElectronImageInputConverter(nativeImage);

  const result = await convert({
    b64: Buffer.from('png').toString('base64'),
    mimeType: 'image/png',
  });

  assert.equal(result.mimeType, 'image/png');
  assert.equal(calls.png, 1);
  assert.equal(calls.jpeg.length, 0);
})
