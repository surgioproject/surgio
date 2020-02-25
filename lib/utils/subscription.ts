import filesize from 'filesize';
import { format, formatDistanceToNow } from 'date-fns';

import { SubscriptionUserinfo } from '../types';

export const parseSubscriptionUserInfo = (str: string): SubscriptionUserinfo => {
  const res = {
    upload: 0,
    download: 0,
    total: 0,
    expire: 0,
  };

  str.split(';').forEach(item => {
    const pair = item.split('=');
    const value = Number(pair[1].trim());

    if (!Number.isNaN(value)) {
      res[pair[0].trim()] = Number(pair[1].trim())
    }
  });

  return res;
};

export const formatSubscriptionUserInfo = (userInfo: SubscriptionUserinfo): {
  readonly upload: string;
  readonly download: string;
  readonly used: string;
  readonly left: string;
  readonly total: string;
  readonly expire: string;
} => {
  return {
    upload: filesize(userInfo.upload),
    download: filesize(userInfo.download),
    used: filesize(userInfo.upload + userInfo.download),
    left: filesize(userInfo.total - userInfo.upload - userInfo.download),
    total: filesize(userInfo.total),
    expire: userInfo.expire
      ? `${format(Date.now() + userInfo.expire, 'yyyy-MM-dd')} (${formatDistanceToNow(Date.now() + userInfo.expire)})`
      : '无数据',
  };
};
