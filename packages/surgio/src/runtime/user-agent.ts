import { NETWORK_SURGIO_UA } from '../constant/index.js'

export const getRuntimeUserAgent = (
  str: string | undefined,
  version: string,
): string => `${str ? str + ' ' : ''}${NETWORK_SURGIO_UA}/${version}`
