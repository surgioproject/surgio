import { VmessNodeConfig } from "../types";
import queryString from 'query-string';

// https://github.com/v2ray/v2ray-core/issues/1569
export const formatVmessUri = (nodeConfig: VmessNodeConfig): string => {
  const uri: string[] = [
    nodeConfig.uuid,
    '@',
    `${nodeConfig.hostname}:${nodeConfig.port}`,
    (nodeConfig.path || '/'),
  ];
  const queries: any = {
    network: nodeConfig.network,
    tls: nodeConfig.tls,
  };

  if (nodeConfig.skipCertVerify) {
    queries['tls.allowInsecure'] = true;
  }

  if (nodeConfig.network === 'ws') {
    if (typeof nodeConfig.wsHeaders !== 'undefined') {
      Object.keys(nodeConfig.wsHeaders).forEach(key => {
        if (!/host/i.test(key)) {
          queries[`ws.headers.${key}`] = nodeConfig.wsHeaders![key];
        }
      });
    }
    if (nodeConfig.host) {
      queries[`ws.headers.host`] = nodeConfig.host;
    }
  }

  return `vmess://${uri.join('')}?${queryString.stringify(queries)}`;
};
