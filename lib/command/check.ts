// istanbul ignore file
import assert from 'assert';
import Command, { Context } from 'common-bin';
import fs from 'fs-extra';
import path from 'path';
import Listr from 'listr';
import inquirer from 'inquirer';

import redis from '../redis';
import { PossibleNodeConfigType } from '../types';
import { defineGlobalOptions } from '../utils/command';
import { getConfig, loadConfig } from '../utils/config';
import { getProvider } from '../provider';
import { errorHandler } from '../utils/error-helper';

class CheckCommand extends Command {
  constructor(rawArgv?: string[]) {
    super(rawArgv);
    this.usage = '使用方法: surgio check [provider]';

    defineGlobalOptions(this.yargs);
  }

  public async run(ctx): Promise<void> {
    loadConfig(ctx.cwd, ctx.argv.config);

    const tasks = this.getTasks();
    const tasksResult = await tasks.run({
      cmdCtx: ctx,
    });
    const { nodeList } = tasksResult;

    if (!process.stdin.isTTY) {
      console.log(JSON.stringify(nodeList, null, 2));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'node',
        message: '请选择节点',
        choices: nodeList.map((node) => ({
          name: `${node.nodeName} - ${node.hostname}:${node.port}`,
          value: node,
        })),
      },
    ]);

    console.log(JSON.stringify(answers.node, null, 2));

    await redis.destroyRedis();
  }

  public get description(): string {
    return '查询 Provider';
  }

  // istanbul ignore next
  public errorHandler(err): void {
    errorHandler.call(this, err);
  }

  private getTasks(): Listr {
    return new Listr<{
      cmdCtx: Context;
      nodeList?: ReadonlyArray<PossibleNodeConfigType>;
    }>([
      {
        title: '获取 Provider 信息',
        task: async (ctx) => {
          const { cmdCtx } = ctx;

          assert(cmdCtx.argv._[0], '没有指定 Provider');

          const providerName = cmdCtx.argv._[0];
          const config = getConfig();
          const filePath = path.resolve(
            config.providerDir,
            `./${providerName}.js`,
          );
          const file: any | Error = fs.existsSync(filePath)
            ? require(filePath)
            : new Error('找不到该 Provider');

          if (file instanceof Error) {
            throw file;
          }

          const provider = await getProvider(providerName, file);

          ctx.nodeList = await provider.getNodeList();
        },
      },
    ]);
  }
}

export = CheckCommand;
