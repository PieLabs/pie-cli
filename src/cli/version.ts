import { existsSync, readJsonSync } from 'fs-extra';
import { execSync } from 'child_process';
import { join } from 'path';
import CliCommand from './cli-command';
import * as _ from 'lodash';

class VersionCommand extends CliCommand {
  constructor() {
    super('--version', 'get the version');
  }

  match(args) {
    return args.version || args.v;
  }

  run(opts) {
    let log = _.isFunction(opts.log) ? opts.log : console.log;
    let pkg = readJsonSync(join(__dirname, '..', '..', 'package.json'));
    let projectRoot = join(__dirname, '../..');
    let gitDir = join(projectRoot, '.git');
    let gitSha = '';
    if (existsSync(gitDir)) {
      gitSha = execSync(`git --git-dir=${gitDir} --work-tree=${projectRoot} rev-parse --short HEAD`, { encoding: 'utf8' });
      gitSha = gitSha.trim();
    }
    let message = `version: ${pkg.version}`;
    message += _.isEmpty(gitSha) ? '' : `, git-sha: ${gitSha}`;
    log(message);
    process.exit(0);
  };
}

export default new VersionCommand();
