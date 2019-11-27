import { URL } from 'url';

export const transformQxRewriteRemote = (str: string, publicUrl: string, deviceIds?: ReadonlyArray<string>): string => {
  return str.split('\n')
    .map(item => {
      if (
        item.startsWith('#') ||
        item.startsWith('//') ||
        item.trim() === ''
      ) {
        return item;
      }

      const rule = item.split(' ');

      if (rule.indexOf('script-response-body') > -1) {
        const scriptPath = rule[3];
        const apiEndpoint = new URL(publicUrl);
        apiEndpoint.pathname = '/qx-script';
        apiEndpoint.searchParams.set('url', `${scriptPath}`);

        if (deviceIds) {
          apiEndpoint.searchParams.set('id', deviceIds.join(','));
        }

        rule[3] = apiEndpoint.toString();

        return rule.join(' ');
      }

      return item;
    })
    .join('\n')
};
