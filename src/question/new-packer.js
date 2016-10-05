import NpmDir from '../npm/npm-dir';
import Config from '../question/config';
import fs from 'fs-extra';
import path from 'path';
import * as elementBundle from '../code-gen/element-bundle';
import * as controllerMap from '../code-gen/controller-map';
import * as markupExample from '../code-gen/markup-example';
import _ from 'lodash'
import { buildLogger } from '../log-factory';

let logger = buildLogger();

/**
 * A question packer.
 * > packing means building 2 files: pie.js and controllers.js
 * 
 * pie pq --support ./node_modules/pie-vue-support 
 * 
 */
export default class Packer {
  constructor(question, frameworkSupport) {
    logger.silly('new Packer');
    this._question = question;
    this._npmDir = new NpmDir(this._question.dir);
    this._frameworkSuport = frameworkSupport;
  }

  clean(opts) {
    logger.debug('[clean]', opts);
    opts = _.extend({}, DEFAULTS, opts);
    let root = this._question.dir;
    return this._npmDir.clean()
      .then(() => elementBundle.clean(root, opts.pieJs))
      .then(() => controllerMap.clean(root, opts.controllersJs))
      .then(() => markupExample.clean(root, opts.exampleFile));
  }

  pack(opts, dependencies) {
    logger.silly('[pack]', opts);

    opts = _.extend({}, DEFAULTS, opts);

    logger.silly('[pack] opts: ', opts);

    //let rawConfig = fs.readJsonSync(path.join(root, opts.configFile));
    //let lookup = fs.readJsonSync(path.join(root, opts.dependenciesFile)) || {};
    //let config = new Config(rawConfig, lookup);
    // let buildKeys = this._question.buildKeys;
    // let support = this._frameworkSupport.fromBuildKeys(buildKeys);
    let npmDependencies = _.extend({}, dependencies, this._question.npmDependencies);

    logger.debug('npm dependencies: ', JSON.stringify(npmDependencies));

    // let npmDependencies = _.extend({}, config.npmDependencies, {
    //   'pie-player': 'PieLabs/pie-player',
    //   'pie-controller': 'PieLabs/pie-controller',
    //   'babel-core': '^6.0.0',
    //   'webpack': '^2.1.0-beta',
    //   'babel-loader': '^6.2.5',
    //   'babel-preset-es2015': '^6.14.0',
    // });
     return this._npmDir.install(npmDependencies)
        .then(() => {
          let buildKeys = this._question.buildKeys;
          let support = this._frameworkSupport.fromBuildKeys(buildKeys);
          logger.silly('supportDependencies: ', JSON.stringify(support.npmDependencies));
          return this._npmDir.installMoreDependencies(support.npmDependencies);
     });

    // return this._npmDir.install(npmDependencies)
    //    .then(() => {
    //      let buildKeys = this._question.buildKeys;
    //      let support = this._frameworkSupport.fromBuildKeys(buildKeys);
    //      return this._npmDir.installMoreDependencies(support.npmDependencies);
    //    })
      
    // .then(() => npmDir.ls())
    // .then(addFrameworkSupportDependencies) 
    // .then(buildElementBundle)
    // .then(() => controllerMap.build(root, opts.configFile, opts.controllersJs)) 
    // .then(() => {
    //   if(!opts.keepBuildAssets){
    //     return npmDir.clean()
    //       .then(() => elementBundle.cleanBuildAssets(root));
    //   } else {
    //     return Promise.resolve();
    //   }
    // }) 
    // .then(() => { 
    //   if(opts.buildExample){
    //     return markupExample.build(root, opts.markupFile, opts.exampleFile, opts.configFile);
    //   } else {
    //     return Promise.resolve('');
    //   }
    // })
    // .then(() => logger.debug('packing completed'));


  }
}

export const DEFAULTS = {
  configFile: 'config.json',
  dependenciesFile: 'dependencies.json',
  markupFile: 'index.html',
  exampleFile: 'example.html',
  buildExample: false,
  keepBuildAssets: false,
  pieJs: 'pie.js',
  controllersJs: 'controllers.js'
}