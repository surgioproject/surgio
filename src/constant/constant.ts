// istanbul ignore file

export const NETWORK_SURGIO_UA = 'surgio';

export const OBFS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1';

export const PROXY_TEST_URL = 'http://cp.cloudflare.com/generate_204';

export const INTERNET_TEST_URL = 'http://connect.rom.miui.com/generate_204';

export const PROXY_TEST_INTERVAL = 1200; // 1200s

export const CLASH_SUPPORTED_RULE = [
  'DOMAIN-SUFFIX',
  'DOMAIN-KEYWORD',
  'DOMAIN',
  'SRC-IP-CIDR',
  'IP-CIDR',
  'IP-CIDR6',
  'GEOIP',
  'DST-PORT',
  'SRC-PORT',
  'MATCH',
  'FINAL',
  'PROCESS-NAME',
] as const;

export const QUANTUMULT_X_SUPPORTED_RULE = [
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
] as const;

// @see https://www.notion.so/2-967c1a07462c43ab88906162bec475a4
export const LOON_SUPPORTED_RULE = [
  'DOMAIN-SUFFIX',
  'DOMAIN',
  'DOMAIN-KEYWORD',
  'USER-AGENT',
  'URL-REGEX',
  'IP-CIDR',
  'GEOIP',
  'FINAL',
] as const;

export const MELLOW_UNSUPPORTED_RULE = [
  'URL-REGEX',
  'USER-AGENT',
  'AND',
  'OR',
  'NOT',
  'DEST-PORT',
  'IN-PORT',
  'SRC-IP',
  'RULE-SET',
] as const;

// @see https://getsurfboard.com/docs/profile-format/rule/
export const SURFBOARD_SUPPORTED_RULE = [
  'DOMAIN-SUFFIX',
  'DOMAIN',
  'DOMAIN-KEYWORD',
  'IP-CIDR',
  'IP-CIDR6',
  'GEOIP',
  'FINAL',
  'PROCESS-NAME',
  'RULE-SET',
  'DOMAIN-SET',
] as const;

export const CATEGORIES = {
  SNIPPET: 'Snippet',
  SURGE: 'Surge',
  QUANTUMULT_X: 'Quantumult X',
  QUANTUMULT_X_SERVER: 'Quantumult X Server',
  QUANTUMULT_X_FILTER: 'Quantumult X Filter',
  QUANTUMULT_X_REWRITE: 'Quantumult X Rewrite',
  CLASH: 'Clash',
  LOON: 'Loon',
  SURFBOARD: 'Surfboard',
} as const;

export const RELAY_SERVICE = 'https://surgio-cors.herokuapp.com/';

export const TMP_FOLDER_NAME = 'surgio-config';

export const CACHE_KEYS = {
  RemoteSnippets: 'remote-snippets',
  Provider: 'provider',
} as const;
