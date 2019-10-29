// tslint:disable-next-line:no-submodule-imports
import { NowRequest, NowResponse } from '@now/node/dist';
import path from 'path';
import Koa from 'koa';
import Router from 'koa-router';
import util from 'util';
import { DEP001 } from '../misc/deprecation';

import { loadConfig } from '../utils';
import { Server } from './server';
import { FcRequest, FcResponse } from './types';

let server;

export function initializer(_, callback): void {
  const cwd = process.cwd();
  const configFile = path.join(cwd, '/surgio.conf.js');
  const config = loadConfig(cwd, configFile);

  server = new Server(cwd, config);

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

export const nowHandler = util.deprecate(async (req: NowRequest, res: NowResponse): Promise<void> => {
  if (!server) {
    const cwd = process.cwd();
    const configFile = path.join(cwd, '/surgio.conf.js');
    const config = loadConfig(cwd, configFile);

    server = new Server(cwd, config);

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
}, DEP001, 'DEP001');

export const createHttpServer = () => {
  process.env.KOA_SERVER = 'true';

  const app = new Koa();
  const router = new Router();
  const cwd = process.cwd();
  const configFile = path.join(cwd, 'surgio.conf.js');
  const config = loadConfig(cwd, configFile, {
    ...(process.env.NODE_ENV === 'development' ? {
      urlBase: '/get-artifact/',
    } : null)
  });
  const surgioServer = new Server(cwd, config);

  const authMiddleware = () => {
    return async (ctx, next) => {
      const accessToken = ctx.query.access_token;
      const needAuth = config.gateway && config.gateway.auth;

      if (!needAuth || (needAuth && accessToken === config.gateway.accessToken)) {
        await next();
      } else {
        ctx.throw(401);
      }
    };
  };

  const prepareArtifact = () => {
    return async (_, next) => {
      await surgioServer.init();
      await next();
    };
  };

  router.use(async (ctx, next) => {
    await next();
    ctx.set('x-powered-by', `surgio@${require('../../package.json').version}`);
    ctx.set('x-robots-tag', 'noindex');
  });
  router.get('/', ctx => {
    ctx.body = 'Surgio Gateway';
  });
  router.get('/get-artifact/:name', authMiddleware(), prepareArtifact(), surgioServer.koaGetArtifact.bind(surgioServer));
  router.get('/list-artifact', authMiddleware(), surgioServer.koaListArtifact.bind(surgioServer));
  router.get('/robot.txt', ctx => {
    ctx.body = 'User-agent: *\n' +
      'Disallow: /';
  });

  app.use(async (ctx, next) => {
    const {
      url,
      method,
    } = ctx;
    const clientIP = ctx.get('x-real-ip') || '-';

    try {
      await next();

      console.log('[request] [%s] %s %s %s "%s"', clientIP, method, ctx.status, url, ctx.get('user-agent') || '-');
    } catch (err) {
      console.log('[request] [%s] %s %s %s "%s"', clientIP, method, ctx.status, url, ctx.get('user-agent') || '-');

      ctx.status = err.status || 500;
      ctx.body = `
        <h1>Error</h1>
        <h2>Message:</h2>
        <p><code>${err.name}: ${err.message}</code></p>
        ${ctx.status >= 500 ? `
          <h2>Stack:</h2>
          <pre>${err.stack}</pre>
        ` : ''}
      `;
      ctx.app.emit('error', err, ctx);
    }
  });

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app.callback();
};
