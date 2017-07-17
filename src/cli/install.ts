import CliCommand from './cli-command';
import { FileNames } from '../question/config';
import Installer from '../install';
import { buildLogger } from 'log-factory';
import { fromPath } from '../question/config/types';
import { join } from 'path';

const logger = buildLogger();

class Cmd extends CliCommand {

  constructor() {
    super(
      'install',
      'install the dependencies'
    );
  }

  public async run(args) {

    const dir = args.dir || args.d || process.cwd();
    logger.info('dir: ', dir);
    const names = FileNames.build(args);

    logger.info('names.json: ', names.json);
    const config = await fromPath(join(dir, names.json));

    logger.info('config', config);
    const installer = new Installer(dir, config);

    const buildInfo = await installer.install();
    logger.silly('buildInfo: ', JSON.stringify(buildInfo));
    return buildInfo;
  }
}

export default new Cmd();
