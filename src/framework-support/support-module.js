import { transform } from 'babel-core';
import resolve from 'resolve';
import { join } from 'path';
import { buildLogger } from '../log-factory';
import vm from 'vm';
import { readFileSync } from 'fs-extra';
import * as m from 'module';

const logger = buildLogger();

/**
 * @param src - the js source code.
 * @return the module running in it's own sandbox
 */

class Sandbox {
  constructor() {
    this.module = {
      exports: {}
    }
  }
  get exports() {
    return this.module.exports;
  }
}

/** 
 * Note: We must run in *this* context to allow `instanceof` to continue to function. 
 * @see: https://github.com/nodejs/node-v0.x-archive/issues/1277
 */
export function mkFromSrc(src, path) {
  logger.debug('[mkFromSrc] path: ', path);

  let babelised = transform(src, {
    plugins: [resolve.sync('babel-plugin-transform-es2015-modules-commonjs', { basedir: join(__dirname, '../..') })]
  });

  logger.silly('[mkFromSrc] code: ', babelised.code);
  let wrapped = m.wrap(babelised.code);
  logger.silly('[mkFromSrc] wrapped: ', wrapped);

  let sandbox = new Sandbox();

  let script = new vm.Script(wrapped, {
    filename: path
  });

  let fn = script.runInThisContext();
  fn(sandbox.exports, () => null, sandbox.module, path);
  logger.silly('[mkFromSrc] sandbox: ', JSON.stringify(sandbox));

  return sandbox.exports.default ? sandbox.exports.default : sandbox.exports;
}

export function mkFromPath(path) {
  logger.silly('[mkFromPath] path: ', path);
  let src = readFileSync(path, 'utf8');
  return mkFromSrc(src, path);
}