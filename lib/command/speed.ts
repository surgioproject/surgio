// istanbul ignore file
import assert from 'assert';
import chalk from 'chalk';
import { ChildProcess } from 'child_process';
import Command from 'common-bin';
import debug from 'debug';
import execa from 'execa';
import getPort from 'get-port';
import inquirer from 'inquirer';
import merge from 'merge-stream';
import { fs } from 'mz';
import os from 'os';
import path from 'path';
import shelljs from 'shelljs';
import speedTest from 'speedtest-net';
import winston, { format, Logger } from 'winston';
import Provider from '../class/Provider';

import { NodeTypeEnum, PossibleNodeConfigType, ShadowsocksNodeConfig } from '../types';
import { getClashNodes, loadConfig, toYaml } from '../utils';
import getProvider from '../utils/getProvider';

const { combine, timestamp, printf } = format;
const speedDebug = debug('speed');
const clashDebug = debug('speed:clash');

class SpeedCommand extends Command {
  private clashProcess?: ChildProcess;
  private logger: Logger = this.getTypedConsoleLogger('speed');
  private httpPort?: number;
  private socksPort?: number;
  private clashConfig?: any;
  private options: object;

  constructor(rawArgv) {
    super(rawArgv);
    this.usage = 'Usage: surgio speed [provider]';
    this.options = {
      config: {
        alias: 'c',
        default: './surgio.conf.js',
      },
    };
  }

  public get description(): string {
    return 'Speed test Shadowsocks server.';
  }

  public async run(ctx): Promise<void> {
    assert(ctx.argv._[0], 'No provider specified.');

    const providerName = ctx.argv._[0];
    const config = loadConfig(ctx.cwd, ctx.argv.config);
    const filePath = path.resolve(config.providerDir, `./${providerName}.js`);
    const file: any|Error = fs.existsSync(filePath) ? require(filePath) : new Error('Provider file cannot be found.');

    if (file instanceof Error) {
      throw file;
    }

    const provider = getProvider(file);

    const nodeList = await provider.getNodeList();
    const nodeConfig = await this.promptSelections(nodeList);

    await this.runTest(nodeConfig);
  }

  private async runTest(json: ShadowsocksNodeConfig): Promise<void> {
    const configDir = path.join(os.tmpdir(), 'surgio-config');
    const configPath = path.join(configDir, 'config.yaml');
    const clashBin = shelljs.which('clash');

    assert(json.type === 'shadowsocks', 'Only Shadowsocks server config is supported.');
    assert(clashBin, 'No runnable clash found.');

    this.httpPort = await getPort({ port: 54455 });
    this.socksPort = await getPort({ port: 54456 });
    this.clashConfig = this.getClashConfig(json, this.httpPort, this.socksPort);
    speedDebug('configDir: %s', configDir);
    speedDebug('httpPort: %s', this.httpPort);

    this.logger.info('Starting Clash.');

    if (!fs.existsSync(configDir)) {
      await fs.mkdir(configDir);
    }
    await fs.writeFile(configPath, toYaml(this.clashConfig));
    this.clashProcess = execa(clashBin.toString(), ['-d', configDir]);

    await this.waitClashReady();
    await this.speedTest();

    this.clashProcess.kill();
  }

  private  waitForInput(): Promise<string> {
    return new Promise(resolve => {
      let result = '';

      function onReadable(): void {
        const chunk = process.stdin.read();
        if (chunk !== null) {
          result += chunk;
        }
      }

      function onEnd(): void {
        process.stdin.off('readable', onReadable);
        process.stdin.off('end', onEnd);

        resolve(result);
      }

      process.stdin.on('readable', onReadable);
      process.stdin.on('end', onEnd);
    });
  }

  private waitClashReady(): Promise<void> {
    assert(this.clashProcess, 'Clash is not attached yet.');

    return new Promise(resolve => {
      const proc = this.clashProcess;
      const stdout = merge(proc.stderr, proc.stdout);

      function onData(chunk): void {
        if (chunk !== null) {
          const text = chunk.toString().trim();
          if (text) {
            clashDebug(text);

            if (text.indexOf('HTTP proxy listening') > -1) {
              resolve();
            }
          }
        }
      }

      stdout.on('data', onData);
    })
  }

  private speedTest(): Promise<void> {
    this.logger.info('Looking for the best test server.');

    return new Promise((resolve, reject) => {
      const testcase = speedTest({
        maxTime: 10000,
        proxy: `http://localhost:${this.httpPort}`,
      });

      testcase.on('bestservers', servers => {
        const server = servers[0];

        this.logger.info(`Endpoint: ${server.cc} - ${server.sponsor}`);
        this.logger.info(`Ping: ${chalk.blueBright(server.bestPing.toFixed(2) + 'ms')}`);
        this.logger.info('Waiting for final results.');
      });

      testcase.on('data', data => {
        this.logger.info('=== Results ===');
        this.logger.info(`Your ISP: ${data.client.country} - ${data.client.isp}`);
        this.logger.info(`Download: ${chalk.blueBright(data.speeds.download) + 'Mbps'}`);
        this.logger.info(`Upload: ${chalk.blueBright(data.speeds.upload) + 'Mbps'}`);
      });

      testcase.on('error', err => {
        reject(err);
      });

      testcase.on('done', () => {
        resolve();
      });
    });
  }

  private getClashConfig(config: ShadowsocksNodeConfig, httpPort: number, socksPort: number): any {
    return {
      port: httpPort,
      'socks-port': socksPort,
      mode: 'Rule',
      'log-level': 'info',
      Proxy: getClashNodes([config]),
      Rule: [
        `FINAL,${config.nodeName}`
      ],
    };
  }

  private getTypedConsoleLogger(loggerName: string): Logger {
    // tslint:disable-next-line:no-shadowed-variable
    const myFormat = printf(({ level, message, timestamp }) => {
      return `${timestamp} [${chalk.cyan(loggerName)}] ${level}: ${message}`;
    });

    return winston.createLogger({
      level: 'info',
      transports: [new winston.transports.Console()],
      format: combine(
        timestamp(),
        myFormat,
      ),
    });
  }

  private async promptSelections(arr: ReadonlyArray<PossibleNodeConfigType>): Promise<ShadowsocksNodeConfig> {
    const choices = arr
      .filter(item => {
        return item.type === NodeTypeEnum.Shadowsocks;
      })
      .map(item => {
        return {
          name: `${item.nodeName} - ${chalk.gray(item.hostname + ':' + item.port)}`,
          value: item,
        };
      });
    const answer = await inquirer.prompt([
      {
        name: 'server',
        message: 'Which server?',
        type: 'list',
        choices,
      }
    ]);

    return (answer as any).server as ShadowsocksNodeConfig;
  }
}

export = SpeedCommand;
