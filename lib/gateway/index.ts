import path from 'path';
import { loadConfig } from '../utils';
import { Server } from './server';
let server;

export function initializer(context, callback): void {
  const cwd = process.cwd();
  const configFile = path.join(cwd, '/surgio.conf.js');
  const config = loadConfig(cwd, configFile);

  server = new Server(config, context);

  server.init()
    .then(() => {
      callback(null, '');
    })
    .catch(err => {
      callback(err, '');
    });
}

export function handler(request, response): void {
  const { url } = request;
  const artifactName = path.basename(url);

  if (!artifactName) {
    server.notFound(response);
    return;
  }

  server.getArtifact(artifactName)
    .then(result => {
      if (result) {
        response.setStatusCode(200);
        response.setHeader('content-type', 'text/plain; charset=utf-8');
        response.setHeader('cache-control', 'private, no-cache, no-store');
        response.send(result);
      } else {
        server.notFound(response);
      }
    })
    .catch(err => {
      server.errorHandler(err, response);
    });
}
