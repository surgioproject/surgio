import { ArtifactConfig, CommandConfig, RemoteSnippet } from '../types';
import { loadRemoteSnippetList } from '../utils';
import { generate } from '../generate';

export class Server {
  public remoteSnippetList: ReadonlyArray<RemoteSnippet>;
  public artifactList: ReadonlyArray<ArtifactConfig>;
  private readonly config: CommandConfig;
  private readonly context: Record<any, any>;

  constructor(config: CommandConfig, context: Record<any, any>) {
    this.config = config;
    this.context = context;
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

  public errorHandler(response: any, err: Error): void {
    response.setStatusCode(500);
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.send(
      '<h1>Server Error</h1>' +
      `<h2>${err.name}: ${err.message}</h2>` +
      `<pre>${err.stack}</pre>`
    );
  }

  public notFound(response: any): void {
    response.setStatusCode(404);
    response.setHeader('content-type', 'text/html; charset=UTF-8');
    response.send(
      '<h1>Not Found</h1>'
    );
  }
}
