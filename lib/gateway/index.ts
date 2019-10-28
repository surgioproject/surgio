// tslint:disable-next-line:no-submodule-imports
import { NowRequest, NowResponse } from '@now/node/dist';
import path from 'path';
import Koa from 'koa';
import Router from 'koa-router';

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
  if (!server) {
    const cwd = process.cwd();
    const configFile = path.join(cwd, '/surgio.conf.js');
    const config = loadConfig(cwd, configFile);

    server = new Server(config);

    await server.init();
  }

  const {
    headers,
    url,
    method,
  } = req;
  const gatewayAction = req.query.action || 'get-artifact';
  const clientIP = headers['x-real-ip'] || '-';

  console.log('[request] [%s] %s %s "%s"', clientIP, method, url, headers['user-agent'] || '-');

  switch (gatewayAction) {
    case 'get-artifact':
      server.nowGetArtifact(req, res);
      break;
    case 'list-artifact':
      server.nowListArtifact(req, res);
      break;
  }
}

export const createHttpServer = () => {
  process.env.KOA_SERVER = 'true';

  const app = new Koa();
  const router = new Router();
  const cwd = process.cwd();
  const configFile = path.join(cwd, '/surgio.conf.js');
  const config = loadConfig(cwd, configFile);
  const surgioServer = new Server(config);

  router.use((() => {
    return async (_, next) => {
      await surgioServer.init();
      await next();
    };
  })());

  router.get('/get-artifact/:name', surgioServer.koaGetArtifact.bind(surgioServer));
  router.get('/list-artifact', surgioServer.koaListArtifact.bind(surgioServer));

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app.callback();
};
