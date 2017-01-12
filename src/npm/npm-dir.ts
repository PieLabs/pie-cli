import { existsSync, writeJsonSync } from 'fs-extra';
import { join } from 'path';
import { buildLogger } from '../log-factory';
import { KeyMap } from './types';
import { spawnPromise } from '../io';

let logger = buildLogger();

export default class NpmDir {

  constructor(readonly rootDir) {
    logger.debug(`rootDir: ${rootDir}`);
  }

  install(name: string, dependencies: KeyMap, devDeps: KeyMap) {
    logger.info('[install] ...');
    return this._writePackageJson(name, dependencies, devDeps)
      .then(() => this._install());
    //TODO - useful to dedupe?
    //.then(() => this._dedupe());
  };

  ls() {
    logger.info('[ls]');
    if (!this._installed) {
      return this._install()
        .then(() => this.ls())
    } else {
      return this._spawnPromise(['ls', '--json'], true)
        .then((result) => {
          logger.debug('[ls] got ls result..');
          try {
            return JSON.parse(result.stdout)
          } catch (e) {
            logger.error('[ls] failed to parse stdout as json: ', result.stdout);
            throw e;
          }
        });
    }
  }

  private get _installed() {
    return existsSync(join(this.rootDir, 'node_modules'));
  }

  private _exists(name) {
    return existsSync(join(this.rootDir, name));
  }

  private _writePackageJson(name: string, dependencies: KeyMap, devDeps: KeyMap) {

    logger.silly('dependencies: ', dependencies);

    let pkg = {
      name: name,
      version: '0.0.1',
      private: true,
      dependencies: dependencies,
      devDependencies: devDeps
    };

    writeJsonSync(join(this.rootDir, 'package.json'), pkg);
    return Promise.resolve(pkg);
  };

  private _dedupe() {
    return spawnPromise('npm', this.rootDir, ['dedupe'], false);
  }

  private _install(args?: any[]) {
    args = args || [];
    let cmd = ['install'].concat(args);
    logger.silly('[install] > final cmd: ', cmd.join(' '));
    return this._spawnPromise(cmd);
  };


  private _spawnPromise(args: string[], ignoreExitCode: boolean = false): Promise<{ stdout: string }> {
    return spawnPromise('npm', this.rootDir, args, ignoreExitCode);
  };
}
