// istanbul ignore file

export const NETWORK_TIMEOUT = process.env.SURGIO_NETWORK_TIMEOUT ? Number(process.env.SURGIO_NETWORK_TIMEOUT) : 5000;

export const NETWORK_CONCURRENCY = process.env.SURGIO_NETWORK_CONCURRENCY ? Number(process.env.SURGIO_NETWORK_CONCURRENCY) : 5;

export const NETWORK_RETRY = process.env.SURGIO_NETWORK_RETRY ? Number(process.env.SURGIO_NETWORK_RETRY) : 1;

export const NETWORK_CLASH_UA = process.env.SURGIO_NETWORK_CLASH_UA ?? 'clash';

export const OBFS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1';

export const PROXY_TEST_URL = 'http://cp.cloudflare.com/generate_204';

export const PROXY_TEST_INTERVAL = 1200;

export const CLASH_SUPPORTED_RULE: ReadonlyArray<string> = [
  'DOMAIN-SUFFIX',
  'DOMAIN-KEYWORD',
  'DOMAIN',
  'SRC-IP-CIDR',
  'IP-CIDR',
  'GEOIP',
  'DST-PORT',
  'SRC-PORT',
  'MATCH',
  'FINAL',
  'PROCESS-NAME',
];

export const QUANTUMULT_X_SUPPORTED_RULE: ReadonlyArray<string> = [
  // 原生支持
  'USER-AGENT',
  'HOST',
  'HOST-KEYWORD',
  'HOST-SUFFIX',
  'DOMAIN',
  'DOMAIN-SUFFIX',
  'DOMAIN-KEYWORD',
  'IP-CIDR',
  'IP-CIDR6',
  'GEOIP',
  'FINAL',
];

export const MELLOW_UNSUPPORTED_RULE: ReadonlyArray<string> = [
  'URL-REGEX', 'USER-AGENT', 'AND', 'OR', 'NOT', 'DEST-PORT', 'IN-PORT', 'SRC-IP', 'RULE-SET'
];

export const REMOTE_SNIPPET_CACHE_MAXAGE: number = process.env.SURGIO_REMOTE_SNIPPET_CACHE_MAXAGE ?
  Number(process.env.SURGIO_REMOTE_SNIPPET_CACHE_MAXAGE) :
  1000 * 60 * 60 * 12; // 12h

export const PROVIDER_CACHE_MAXAGE: number = process.env.SURGIO_PROVIDER_CACHE_MAXAGE ?
  Number(process.env.SURGIO_PROVIDER_CACHE_MAXAGE) :
  10 * 60 * 1000; // 10min

export const CATEGORIES = {
  SNIPPET: 'Snippet',
  SURGE: 'Surge',
  QUANTUMULT_X: 'Quantumult X',
  QUANTUMULT_X_SERVER: 'Quantumult X Server',
  QUANTUMULT_X_FILTER: 'Quantumult X Filter',
  QUANTUMULT_X_REWRITE: 'Quantumult X Rewrite',
  CLASH: 'Clash',
};

export const RELAY_SERVICE = 'https://surgio-cors.herokuapp.com/';

export const ERR_INVALID_FILTER = '传入的过滤器无效，请检查语法和变量名是否正确';
