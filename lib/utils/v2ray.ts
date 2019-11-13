import { VmessNodeConfig } from "../types";
import queryString from 'query-string';

// https://github.com/v2ray/v2ray-core/issues/1569
export const formatVmessUri = (nodeConfig: VmessNodeConfig): string => {
  const uri = [
    nodeConfig.uuid,
    '@',
    `${nodeConfig.hostname}:${nodeConfig.port}`,
    (nodeConfig.path || '/'),
  ];
  const queries = {
    network: nodeConfig.network,
    tls: nodeConfig.tls,
  };

  return `vmess://${uri.join('')}?${queryString.stringify(queries)}`;
};
