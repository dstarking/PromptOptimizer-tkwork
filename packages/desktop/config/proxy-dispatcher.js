const EventEmitter = require('node:events');

function normalizeHostname(hostname) {
  return String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
    .split('%')[0];
}

function parseIPv4(hostname) {
  const parts = hostname.split('.');
  if (parts.length !== 4) {
    return null;
  }

  const octets = parts.map((part) => Number(part));
  if (octets.some((octet, index) => !/^\d+$/.test(parts[index]) || Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return null;
  }

  return octets;
}

function isPrivateIPv4(hostname) {
  const octets = parseIPv4(hostname);
  if (!octets) {
    return false;
  }

  const [first, second] = octets;

  return first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
}

function isPrivateIPv6(hostname) {
  if (!hostname.includes(':')) {
    return false;
  }

  if (hostname === '::' || hostname === '::1') {
    return true;
  }

  if (hostname.startsWith('::ffff:')) {
    return isPrivateIPv4(hostname.slice('::ffff:'.length));
  }

  return /^(fc|fd)[0-9a-f:]+$/i.test(hostname) || /^fe[89ab][0-9a-f:]*$/i.test(hostname);
}

function shouldBypassProxyForHostname(hostname) {
  const normalized = normalizeHostname(hostname);
  if (!normalized) {
    return false;
  }

  if (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    !normalized.includes('.')
  ) {
    return true;
  }

  return isPrivateIPv4(normalized) || isPrivateIPv6(normalized);
}

function shouldBypassProxyForOrigin(origin) {
  try {
    const url = origin instanceof URL ? origin : new URL(String(origin));
    return shouldBypassProxyForHostname(url.hostname);
  } catch {
    return false;
  }
}

function mapProxyDecisionToUrl(proxyDecision) {
  const normalizedDecision = String(proxyDecision || 'DIRECT').trim();

  if (normalizedDecision.startsWith('PROXY ') || normalizedDecision.startsWith('HTTPS ')) {
    return `http://${normalizedDecision.split(' ')[1]}`;
  }

  if (normalizedDecision.startsWith('SOCKS5 ')) {
    return `socks5://${normalizedDecision.split(' ')[1]}`;
  }

  if (normalizedDecision.startsWith('SOCKS ')) {
    return `socks://${normalizedDecision.split(' ')[1]}`;
  }

  return 'DIRECT';
}

function settleDispatchers(dispatchers, methodName, args) {
  const uniqueDispatchers = [...new Set(dispatchers.filter(Boolean))];

  return Promise.all(uniqueDispatchers.map((dispatcher) => {
    const method = dispatcher && dispatcher[methodName];
    if (typeof method !== 'function') {
      return Promise.resolve();
    }

    try {
      const result = method.apply(dispatcher, args);
      return result && typeof result.then === 'function'
        ? result
        : Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  })).then(() => undefined);
}

class LocalBypassDispatcher extends EventEmitter {
  constructor({
    directDispatcher,
    proxiedDispatcher,
    shouldBypassProxy = shouldBypassProxyForOrigin
  }) {
    super();
    this.directDispatcher = directDispatcher;
    this.proxiedDispatcher = proxiedDispatcher;
    this.shouldBypassProxy = shouldBypassProxy;
  }

  selectDispatcher(options) {
    return this.shouldBypassProxy(options && options.origin)
      ? this.directDispatcher
      : this.proxiedDispatcher;
  }

  dispatch(options, handler) {
    return this.selectDispatcher(options).dispatch(options, handler);
  }

  close(callback) {
    const promise = settleDispatchers(
      [this.directDispatcher, this.proxiedDispatcher],
      'close',
      []
    );

    if (typeof callback === 'function') {
      promise.finally(() => callback());
      return;
    }

    return promise;
  }

  destroy(err, callback) {
    const actualError = typeof err === 'function' ? undefined : err;
    const actualCallback = typeof err === 'function' ? err : callback;
    const args = actualError === undefined ? [] : [actualError];
    const promise = settleDispatchers(
      [this.directDispatcher, this.proxiedDispatcher],
      'destroy',
      args
    );

    if (typeof actualCallback === 'function') {
      promise.finally(() => actualCallback());
      return;
    }

    return promise;
  }
}

function createGlobalDispatcherFromProxyDecision({ Agent, ProxyAgent, proxyDecision }) {
  const mappedProxyUrl = mapProxyDecisionToUrl(proxyDecision);
  const directDispatcher = new Agent();

  if (mappedProxyUrl === 'DIRECT') {
    return {
      dispatcher: directDispatcher,
      mappedProxyUrl
    };
  }

  return {
    dispatcher: new LocalBypassDispatcher({
      directDispatcher,
      proxiedDispatcher: new ProxyAgent(mappedProxyUrl)
    }),
    mappedProxyUrl
  };
}

module.exports = {
  LocalBypassDispatcher,
  createGlobalDispatcherFromProxyDecision,
  isPrivateIPv4,
  isPrivateIPv6,
  mapProxyDecisionToUrl,
  shouldBypassProxyForHostname,
  shouldBypassProxyForOrigin
};
