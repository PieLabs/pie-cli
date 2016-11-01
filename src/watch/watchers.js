import { buildLogger } from '../log-factory';
import chokidar from 'chokidar';
import { relative, resolve, join } from 'path';
import _ from 'lodash';
import fs from 'fs-extra';

const logger = buildLogger();

export class BaseWatch {

  constructor(ignores) {
    this.ignores = ignores;
  }

  getDestination(path) {
    let relativePath = relative(this.srcRoot, path);
    let destination = join(this.targetRoot, relativePath);
    logger.silly(`[BaseWatch] [getDestination], path: ${path}, relativePath: ${relativePath}, destination: ${destination}`);
    return destination;
  }

  start() {

    logger.debug('[BaseWatch] [start] srcRoot: ', this.srcRoot);

    this._watcher = chokidar.watch(this.srcRoot, {
      ignored: _.concat(this.ignores, [
        /package\.json/,
        /[\/\\]\./,
        /.*node_modules.*/,
        /\.git.*/,
        /.*docs.*/,
        /.*\.d\.ts/,
        /typings/,
        /jsconfig\.json/
      ]),
      ignoreInitial: true,
      persistent: true
    });

    let onAdd = (path) => {
      logger.debug(`File added: ${path} - copy`);
      fs.copy(path, this.getDestination(path));
    };

    //TODO: Add file size change detection to prevent unnecessary updates
    let onChange = (path) => {
      logger.debug(`File changed: ${path} - copy`);
      fs.copy(path, this.getDestination(path));
    }

    let onUnlink = (path) => {
      logger.debug(`File unlinked: ${path} - delete`);
      fs.remove(this.getDestination(path));
    }

    let onError = (e) => logger.error(e);
    let onReady = () => {
      logger.info(`Watcher for ${this.srcRoot} - Ready`);
      logger.silly('watched: \n', this._watcher.getWatched());
    }

    this._watcher
      .on('add', onAdd)
      .on('change', onChange)
      .on('unlink', onUnlink)
      .on('error', onError)
      .on('ready', onReady);
  }
}

export class PieControllerWatch extends BaseWatch {

  constructor(name, relativePieRoot, questionRoot) {
    super([]);
    this.name = name;
    this.relativePieRoot = relativePieRoot;
    this.questionRoot = questionRoot;
  }

  get srcRoot() {
    return resolve(join(this.questionRoot, this.relativePieRoot, 'controller'));
  }

  get targetRoot() {
    return resolve(join(this.questionRoot, 'controllers', 'node_modules', `${this.name}-controller`));
  }
}

export class PieClientWatch extends BaseWatch {
  constructor(name, relativePieRoot, questionRoot) {
    super([/.*controller.*/]);
    this.name = name;
    this.relativePieRoot = relativePieRoot;
    this.questionRoot = questionRoot;
  }

  get srcRoot() {
    return resolve(this.questionRoot, this.relativePieRoot);
  }

  get targetRoot() {
    return resolve(join(this.questionRoot, 'node_modules', this.name));
  }
}

export class PieWatch {

  constructor(name, relativePath, rootDir) {
    logger.debug('[PieWatch] constructor: ', name, relativePath, rootDir);
    this.client = new PieClientWatch(name, relativePath, rootDir);
    this.controller = new PieControllerWatch(name, relativePath, rootDir);
  }

  start() {
    this.client.start();
    this.controller.start();
  }
}