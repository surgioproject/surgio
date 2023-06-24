import { RELAY_SERVICE } from '../constant'

export default function relayableUrl(
  url: string,
  relayUrl?: boolean | string,
): string {
  if (typeof relayUrl === 'boolean') {
    return `${RELAY_SERVICE}${url}`
  } else if (typeof relayUrl === 'string') {
    if (relayUrl.includes('%%URL%%')) {
      return relayUrl.replace('%%URL%%', encodeURIComponent(url))
    } else if (relayUrl.includes('%URL%')) {
      return relayUrl.replace('%URL%', url)
    } else {
      throw new Error('relayUrl 中必须包含 %URL% 或 %%URL%% 替换指示符')
    }
  }
  return url
}
