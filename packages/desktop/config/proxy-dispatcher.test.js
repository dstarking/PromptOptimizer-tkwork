const test = require('node:test');
const assert = require('node:assert/strict');

const {
  LocalBypassDispatcher,
  createGlobalDispatcherFromProxyDecision,
  mapProxyDecisionToUrl,
  shouldBypassProxyForHostname,
  shouldBypassProxyForOrigin
} = require('./proxy-dispatcher');

test('should bypass proxy for loopback and private hosts', () => {
  assert.equal(shouldBypassProxyForHostname('localhost'), true);
  assert.equal(shouldBypassProxyForHostname('devbox'), true);
  assert.equal(shouldBypassProxyForHostname('printer.local'), true);
  assert.equal(shouldBypassProxyForHostname('127.0.0.1'), true);
  assert.equal(shouldBypassProxyForHostname('10.0.0.8'), true);
  assert.equal(shouldBypassProxyForHostname('172.16.5.9'), true);
  assert.equal(shouldBypassProxyForHostname('172.31.255.1'), true);
  assert.equal(shouldBypassProxyForHostname('192.168.1.3'), true);
  assert.equal(shouldBypassProxyForHostname('169.254.10.20'), true);
  assert.equal(shouldBypassProxyForHostname('::1'), true);
  assert.equal(shouldBypassProxyForHostname('fe80::1'), true);
  assert.equal(shouldBypassProxyForHostname('fd12:3456:789a::1'), true);
  assert.equal(shouldBypassProxyForHostname('::ffff:192.168.1.3'), true);
});

test('should keep public hosts on the proxy path', () => {
  assert.equal(shouldBypassProxyForHostname('api.deepseek.com'), false);
  assert.equal(shouldBypassProxyForHostname('8.8.8.8'), false);
  assert.equal(shouldBypassProxyForOrigin('https://api.openai.com/v1/models'), false);
  assert.equal(shouldBypassProxyForOrigin('http://192.168.1.3:8000/v1/models'), true);
});

test('should map Electron proxy decisions to undici proxy URLs', () => {
  assert.equal(mapProxyDecisionToUrl('PROXY 127.0.0.1:7890'), 'http://127.0.0.1:7890');
  assert.equal(mapProxyDecisionToUrl('HTTPS 127.0.0.1:7890'), 'http://127.0.0.1:7890');
  assert.equal(mapProxyDecisionToUrl('SOCKS5 127.0.0.1:7891'), 'socks5://127.0.0.1:7891');
  assert.equal(mapProxyDecisionToUrl('SOCKS 127.0.0.1:7891'), 'socks://127.0.0.1:7891');
  assert.equal(mapProxyDecisionToUrl('DIRECT'), 'DIRECT');
});

test('LocalBypassDispatcher should route local origins directly and public origins through proxy', () => {
  const calls = [];
  const directDispatcher = {
    dispatch(options, handler) {
      calls.push({ kind: 'direct', options, handler });
      return true;
    },
    close() {
      calls.push({ kind: 'direct-close' });
      return Promise.resolve();
    },
    destroy() {
      calls.push({ kind: 'direct-destroy' });
      return Promise.resolve();
    }
  };
  const proxiedDispatcher = {
    dispatch(options, handler) {
      calls.push({ kind: 'proxy', options, handler });
      return true;
    },
    close() {
      calls.push({ kind: 'proxy-close' });
      return Promise.resolve();
    },
    destroy() {
      calls.push({ kind: 'proxy-destroy' });
      return Promise.resolve();
    }
  };

  const dispatcher = new LocalBypassDispatcher({
    directDispatcher,
    proxiedDispatcher
  });

  const localHandler = {};
  const publicHandler = {};

  dispatcher.dispatch({ origin: 'http://192.168.1.3:8000', path: '/v1/models', method: 'GET' }, localHandler);
  dispatcher.dispatch({ origin: 'https://api.deepseek.com', path: '/v1/chat/completions', method: 'POST' }, publicHandler);

  assert.deepEqual(calls.slice(0, 2), [
    {
      kind: 'direct',
      options: { origin: 'http://192.168.1.3:8000', path: '/v1/models', method: 'GET' },
      handler: localHandler
    },
    {
      kind: 'proxy',
      options: { origin: 'https://api.deepseek.com', path: '/v1/chat/completions', method: 'POST' },
      handler: publicHandler
    }
  ]);
});

test('createGlobalDispatcherFromProxyDecision should wrap proxy mode but keep DIRECT untouched', () => {
  class FakeAgent {
    dispatch() {
      return true;
    }
    close() {
      return Promise.resolve();
    }
    destroy() {
      return Promise.resolve();
    }
  }

  class FakeProxyAgent extends FakeAgent {
    constructor(uri) {
      super();
      this.uri = uri;
    }
  }

  const direct = createGlobalDispatcherFromProxyDecision({
    Agent: FakeAgent,
    ProxyAgent: FakeProxyAgent,
    proxyDecision: 'DIRECT'
  });
  const proxied = createGlobalDispatcherFromProxyDecision({
    Agent: FakeAgent,
    ProxyAgent: FakeProxyAgent,
    proxyDecision: 'PROXY 127.0.0.1:7890'
  });

  assert.equal(direct.mappedProxyUrl, 'DIRECT');
  assert.equal(direct.dispatcher instanceof FakeAgent, true);
  assert.equal(proxied.mappedProxyUrl, 'http://127.0.0.1:7890');
  assert.equal(proxied.dispatcher instanceof LocalBypassDispatcher, true);
});
