import CommonBin from 'common-bin';

export const defineGlobalOptions = (yargs: CommonBin['yargs']): void => {
  yargs.options({
    c: {
      alias: 'config',
      default: './surgio.conf.js',
      description: '配置文件',
    },
    V: {
      alias: 'verbose',
      demandOption: false,
      describe: '打印调试日志',
      type: 'boolean',
    },
  });

  yargs.group(['help', 'version', 'config', 'verbose'], 'Global Options:');

  // 禁用 yargs 内部生成的 help 信息，似乎和 common-bin 的 load 有冲突
  yargs.help(false);
};
