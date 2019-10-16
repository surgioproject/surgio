// tslint:disable-next-line:no-submodule-imports
import { NowRequest, NowResponse } from '@now/node/dist';
import path from 'path';
import { loadConfig } from '../utils';
import { Server } from './server';
import { FcRequest, FcResponse } from './types';

let server;

export function initializer(_, callback): void {
  const cwd = process.cwd();
  const configFile = path.join(cwd, '/surgio.conf.js');
  const config = loadConfig(cwd, configFile);

  server = new Server(config);

  server.init()
    .then(() => {
      callback(null, '');
    })
    .catch(err => {
      callback(err, '');
    });
}

export function handler(request: FcRequest, response: FcResponse): void {
  const { url, clientIP, headers, method } = request;
  const artifactName = path.basename(url);

  if (!artifactName) {
    server.fcNotFound(response);
    return;
  }

  console.log('[request] [%s] %s %s "%s"', clientIP, method, url, headers['user-agent'] || '-');

  server.getArtifact(artifactName)
    .then(result => {
      if (result) {
        response.setStatusCode(200);
        response.setHeader('content-type', 'text/plain; charset=utf-8');
        response.setHeader('cache-control', 'private, no-cache, no-store');
        response.send(result);
      } else {
        server.fcNotFound(response);
      }
    })
    .catch(err => {
      server.fcErrorHandler(response, err);
    });
}

export async function nowHandler(req: NowRequest, res: NowResponse): Promise<void> {
  const cwd = process.cwd();
  const configFile = path.join(cwd, '/surgio.conf.js');
  const config = loadConfig(cwd, configFile);

  server = new Server(config);

  await server.init();

  const {
    query: { name: artifactName },
    headers,
    url,
    method,
  } = req;
  const clientIP = headers['x-real-ip'] || '-';

  if (!artifactName) {
    server.nowNotFound(res);
    return;
  }

  console.log('[request] [%s] %s %s "%s"', clientIP, method, url, headers['user-agent'] || '-');

  server.getArtifact(artifactName)
    .then(result => {
      if (result) {
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.setHeader('cache-control', 'private, no-cache, no-store');
        res.send(result);
      } else {
        server.nowNotFound(res);
      }
    })
    .catch(err => {
      server.nowErrorHandler(res, err);
    });
}
