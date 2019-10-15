// tslint:disable-next-line:no-submodule-imports
import { NowResponse } from '@now/node/dist';
import { ArtifactConfig, CommandConfig, RemoteSnippet } from '../types';
import { loadRemoteSnippetList } from '../utils';
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
  }

  public fcNotFound(response: FcResponse): void {
    response.setStatusCode(404);
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.send(
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
  }

  public nowNotFound(response: NowResponse): void {
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response
      .status(404)
      .send(
        '<h1>Not Found</h1>'
      );
  }
}
