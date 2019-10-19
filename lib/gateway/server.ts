// tslint:disable-next-line:no-submodule-imports
import { NowRequest, NowResponse } from '@now/node/dist';
import nunjucks from 'nunjucks';

import { ArtifactConfig, CommandConfig, RemoteSnippet } from '../types';
import { getDownloadUrl, loadRemoteSnippetList } from '../utils';
import { generate } from '../generate';
import { FcResponse } from './types';

export class Server {
  public remoteSnippetList: ReadonlyArray<RemoteSnippet>;
  public artifactList: ReadonlyArray<ArtifactConfig>;
  private readonly config: CommandConfig;

  constructor(config: CommandConfig) {
    this.config = config;
  }

  public async init(): Promise<void> {
    const config = this.config;
    const remoteSnippetsConfig = config.remoteSnippets || [];

    this.artifactList = config.artifacts;
    this.remoteSnippetList = await loadRemoteSnippetList(remoteSnippetsConfig);
  }

  public async getArtifact(artifactName: string): Promise<string> {
    const target = this.artifactList.filter(item => item.name === artifactName);

    if (!target.length) {
      return undefined;
    }

    return await generate(this.config, target[0], this.remoteSnippetList);
  }

  public fcErrorHandler(response: FcResponse, err: Error): void {
    response.setStatusCode(500);
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.send(
      '<h1>Server Error</h1>' +
      `<h2>${err.name}: ${err.message}</h2>` +
      `<pre>${err.stack}</pre>`
    );
    console.error(err);
  }

  public fcNotFound(res: FcResponse): void {
    res.setStatusCode(404);
    res.setHeader('content-type', 'text/html; charset=UTF-8');
    res.send(
      '<h1>Not Found</h1>'
    );
  }

  public nowErrorHandler(response: NowResponse, err: Error): void {
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response
      .status(500)
      .send(
        '<h1>Server Error</h1>' +
        `<h2>${err.name}: ${err.message}</h2>` +
        `<pre>${err.stack}</pre>`
      );
    console.error(err);
  }

  public nowNotFound(res: NowResponse): void {
    res.setHeader('content-type', 'text/html; charset=UTF-8');
    res
      .status(404)
      .send(
        '<h1>Not Found</h1>'
      );
  }

  public nowGetArtifact(req: NowRequest, res: NowResponse): void {
    const {
      query: { name: artifactName },
    } = req;

    if (!artifactName) {
      this.nowNotFound(res);
      return;
    }

    this.getArtifact(artifactName as string)
      .then(result => {
        if (result) {
          res.setHeader('content-type', 'text/plain; charset=utf-8');
          res.setHeader('cache-control', 'private, no-cache, no-store');
          res.send(result);
        } else {
          this.nowNotFound(res);
        }
      })
      .catch(err => {
        this.nowErrorHandler(res, err);
      });
  }

  public nowListArtifact(_: NowRequest, res: NowResponse): void {
    const engine = nunjucks.configure({
      autoescape: false,
    });
    const artifactListTpl = require('./template/artifact-list').default;
    const result = engine.renderString(artifactListTpl, {
      artifactList: this.artifactList,
      getDownloadUrl: (name: string) => getDownloadUrl(this.config.urlBase, name),
      encodeURIComponent,
    });
    res.send(result);
  }
}
