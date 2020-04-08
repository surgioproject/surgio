import { NowRequest, NowResponse } from '@now/node/dist';
import { Context } from 'koa';
import createError from 'http-errors';
import fs from 'fs-extra';
import nunjucks, { Environment } from 'nunjucks';
import path from "path";
import { PackageJson } from 'type-fest';
import legacyUrl from 'url';
import got from 'got';
import { transformQxRewriteRemote } from '../utils/qx-helper';

import { getEngine } from '../generator/template';
import { ArtifactConfig, CommandConfig, RemoteSnippet } from '../types';
import { getDownloadUrl } from '../utils';
import { loadRemoteSnippetList } from '../utils/remote-snippet';
import * as filters from '../utils/filter';
import { generate } from '../generate';
import { FcResponse } from './types';

export class Server {
  public static getEditUrl(repository: PackageJson['repository'], p: string): string {
    if (repository) {
      const base = typeof repository === 'string' ?
        repository :
        repository.url;

      return legacyUrl.resolve(base.endsWith('/') ? base : `${base}/`, p);
    } else {
      return '';
    }
  }

  public remoteSnippetList: ReadonlyArray<RemoteSnippet>;
  public artifactList: ReadonlyArray<ArtifactConfig>;
  private readonly pkgFile?: PackageJson;
  private readonly templateEngine: Environment;

  constructor(public cwd: string, public readonly config: CommandConfig) {
    const pkgFile = path.join(cwd, 'package.json');

    this.config = config;
    this.artifactList = config.artifacts;
    this.templateEngine = getEngine(config.templateDir);
    if (fs.existsSync(pkgFile)) {
      this.pkgFile = require(pkgFile);
    }
  }

  public async init(): Promise<void> {
    const remoteSnippetsConfig = this.config.remoteSnippets || [];

    this.remoteSnippetList = await loadRemoteSnippetList(remoteSnippetsConfig);
  }

  public async getArtifact(artifactName: string): Promise<string|undefined> {
    const target = this.artifactList.filter(item => item.name === artifactName);

    if (!target.length) {
      return undefined;
    }

    return await generate(this.config, target[0], this.remoteSnippetList, this.templateEngine);
  }

  public async transformArtifact(artifactName: string, format: string, filter?: string): Promise<string|createError.HttpError> {
    const target = this.artifactList.filter(item => item.name === artifactName);
    let filterName;

    if (!target.length) {
      return undefined;
    }
    if (filter) {
      filterName = filters.hasOwnProperty(filter) ? filter : `customFilters.${filter}`;
    }

    switch (format) {
      case 'surge-policy': {
        const artifact = {
          ...target[0],
          template: undefined,
          templateString: `{{ getSurgeNodes(nodeList${filterName ? `, ${filterName}` : ''}) }}`,
        };
        return await generate(this.config, artifact, this.remoteSnippetList, this.templateEngine);
      }

      case 'qx-server': {
        const artifact = {
          ...target[0],
          template: undefined,
          templateString: `{{ getQuantumultXNodes(nodeList${filterName ? `, ${filterName}` : ''}) }}`,
        };
        return await generate(this.config, artifact, this.remoteSnippetList, this.templateEngine);
      }

      case 'clash-provider': {
        const artifact = {
          ...target[0],
          template: undefined,
          templateString: [
            '---',
            'proxies:',
            `{{ getClashNodes(nodeList${filterName ? `, ${filterName}` : ''}) | yaml }}`,
            '...'
          ].join('\n')
        };
        return await generate(this.config, artifact, this.remoteSnippetList, this.templateEngine);
      }

      default:
        return createError(400, 'unsupported format');
    }
  }

  public async koaGetArtifact(ctx: Context): Promise<void> {
    const dl = ctx.query.dl;
    const format = ctx.query.format;
    const filter = ctx.query.filter;
    const artifactName = ctx.params.name;
    const result = format !== void 0 ?
      await this.transformArtifact(artifactName as string, format as string, filter as string) :
      await this.getArtifact(artifactName as string);

    if (result instanceof createError.HttpError) {
      ctx.throw(result);
      return;
    }

    if (typeof result === 'string') {
      ctx.set('content-type', 'text/plain; charset=utf-8');
      ctx.set('cache-control', 'private, no-cache, no-store');

      if (dl === '1') {
        ctx.set('content-disposition', `attachment; filename="${artifactName}"`);
      }

      ctx.body = result;
    } else {
      ctx.throw(404);
    }
  }

  public async koaListArtifact(ctx: Context): Promise<void> {
    const engine = nunjucks.configure({
      autoescape: false,
    });
    const artifactListTpl = require('./template/artifact-list').default;
    const accessToken = this.config.gateway && this.config.gateway.accessToken;

    ctx.body = engine.renderString(artifactListTpl, {
      artifactList: this.artifactList,
      getPreviewUrl: (name: string) => getDownloadUrl(this.config.urlBase, name, true, accessToken),
      getDownloadUrl: (name: string) => getDownloadUrl(this.config.urlBase, name, false, accessToken),
      supportEdit: !!(this?.pkgFile?.repository),
      getEditUrl: p => Server.getEditUrl(this?.pkgFile?.repository, p),
      encodeURIComponent,
      surgioVersion: require('../../package.json').version,
    });
  }

  public async processQuanXScript(ctx: Context): Promise<void> {
    const { url, id: idFromUrl } = ctx.query;
    const idFromConfig = this.config?.quantumultXConfig?.deviceIds;
    const deviceIds = idFromUrl ? idFromUrl.split(',') : (idFromConfig || []);

    if (!url) {
      ctx.throw(400, 'invalid url');
    }

    const content = await got.get(url)
      // istanbul ignore next
      .catch(err => {
        throw createError(500, `请求文件时出错: ${err.message}`);
      });
    const contentType: string|undefined = content.headers['content-type'];

    if (
      !contentType ||
      (
        !contentType.includes('text/plain') &&
        !contentType.includes('application/javascript')
      )
    ) {
      ctx.throw(400, '该文件不是一个可转换的脚本文件');
    }

    const insertion = '' +
      '/**\n' +
      ' * @supported ' + `${deviceIds.join(' ')}` + '\n' +
      ' * THIS COMMENT IS GENERATED BY SURGIO\n' +
      ' */\n\n';

    ctx.set('content-type', contentType);
    ctx.set('content-disposition', 'attachment;filename=script.js');
    ctx.set('cache-control', 'max-age=3600, s-maxage=3600');
    ctx.body = insertion + content.body;
  }

  public async processQuanXRewriteRemote(ctx: Context): Promise<void> {
    const { url, id: idFromUrl } = ctx.query;
    const deviceIds = idFromUrl ? idFromUrl.split(',') : undefined;
    const publicUrl = this.config.publicUrl;

    if (!url) {
      ctx.throw(400, 'invalid url');
    }

    const content = await got.get({
      url,
    })
      // istanbul ignore next
      .catch(err => {
        throw createError(500, `请求文件时出错: ${err.message}`);
      });
    const contentType: string|undefined = content.headers['content-type'];

    if (
      !contentType ||
      !contentType.includes('text/plain')
    ) {
      ctx.throw(400, '该文件不是一个可转换的文件');
      return;
    }

    ctx.set('content-type', contentType);
    ctx.set('cache-control', 'max-age=3600, s-maxage=3600');
    ctx.set('content-disposition', 'attachment;filename=rewrite-remote.conf');
    ctx.body = transformQxRewriteRemote(content.body, publicUrl, deviceIds);
  }

  // istanbul ignore next
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

  // istanbul ignore next
  public fcNotFound(res: FcResponse): void {
    res.setStatusCode(404);
    res.setHeader('content-type', 'text/html; charset=UTF-8');
    res.send(
      '<h1>Not Found</h1>'
    );
  }

  // istanbul ignore next
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

  // istanbul ignore next
  public nowNotFound(res: NowResponse): void {
    res.setHeader('content-type', 'text/html; charset=UTF-8');
    res
      .status(404)
      .send(
        '<h1>Not Found</h1>'
      );
  }

  // istanbul ignore next
  public nowGetArtifact(req: NowRequest, res: NowResponse): void {
    const {
      query: { name: artifactName, dl },
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

          if (dl === '1'){
            res.setHeader('content-disposition', `attachment; filename="${artifactName}"`);
          }

          res.send(result);
        } else {
          this.nowNotFound(res);
        }
      })
      .catch(err => {
        this.nowErrorHandler(res, err);
      });
  }

  // istanbul ignore next
  public nowListArtifact(_: NowRequest, res: NowResponse): void {
    const engine = nunjucks.configure({
      autoescape: false,
    });
    const artifactListTpl = require('./template/artifact-list').default;
    const result = engine.renderString(artifactListTpl, {
      artifactList: this.artifactList,
      getPreviewUrl: (name: string) => getDownloadUrl(this.config.urlBase, name),
      getDownloadUrl: (name: string) => (
        legacyUrl.format({
          pathname: '/gateway.js',
          query: {
            name,
            action: 'get-artifact',
            dl: '1',
          },
        })
      ),
      encodeURIComponent,
      surgioVersion: require('../../package.json').version,
    });
    res.send(result);
  }
}
