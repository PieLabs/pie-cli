import * as _ from 'lodash';
import * as webpack from 'webpack';

import { join, resolve } from 'path';

import { SupportConfig } from '../framework-support/index';
import baseConfig from '../question/build/base-config';
import { buildLogger } from 'log-factory';
import { remove } from 'fs-extra';

const logger = buildLogger();

export type Compiler = webpack.compiler.Compiler;

export class Tag {
  constructor(readonly name: string, readonly path?: string) {
    this.path = this.path || `./${this.name}.js`;
  }

  get tag(): string {
    return `<${this.name}></${this.name}>`;
  }
}

export function removeFiles(dir, files: string[]): Promise<string[]> {
  const p: Promise<string>[] = _.map(
    files,
    f =>
      new Promise((res, reject) => {
        remove(join(dir, f), err => {
          if (err) {
            reject(err);
          } else {
            res(f);
          }
        });
      })
  );
  return Promise.all(p);
}

export const toNodeModules = (d: string) => resolve(join(d, 'node_modules'));

export function webpackConfig(
  resolveModules: string[],
  root: string,
  support: SupportConfig,
  entry: string,
  bundle: string,
  outpath?: string,
  sourceMaps: boolean = false
) {
  outpath = outpath || root;

  const base = baseConfig(root);

  logger.debug('support modules: ', support.modules);

  const coreModules = [
    'node_modules',
    resolve(join(__dirname, '../../node_modules'))
  ].concat(_.compact(support.modules));

  resolveModules = resolveModules.map(toNodeModules).concat(coreModules);

  const resolveLoaderModules = [toNodeModules(root)].concat(coreModules);

  const out = _.extend(base, {
    context: root,
    entry: `./${entry}`,
    module: {
      rules: base.module.rules.concat(support.rules)
    },
    output: {
      filename: bundle,
      path: outpath
    },
    resolve: {
      extensions: _.uniq(['.js'].concat(support.extensions)),
      modules: resolveModules,
      mainFields: ['browser', 'main']
    },
    resolveLoader: {
      modules: resolveLoaderModules
    }
  });

  if (sourceMaps) {
    out.devtool = 'eval';
  }

  return out;
}

export const clientDependencies = (args: any) =>
  args.configuration.app.dependencies;

export class Out {
  public static build(args) {
    return new Out(
      args.questionItemTagName ? new Tag(args.questionItemTagName) : undefined,
      args.questionElements,
      args.questionControllers,
      args.questionExample,
      args.questionArchive
    );
  }

  constructor(
    readonly completeItemTag: Tag = new Tag('pie-item'),
    readonly viewElements: string = 'pie-view.js',
    readonly controllers: string = 'pie-controller.js',
    readonly example: string = 'example.html',
    readonly archive: string = 'pie-item.tar.gz'
  ) {}
}

/**
 * @deprecated This should be removed
 */
export type Names = {
  build: BuildNames;
  out: Out;
};

type BuildNames = {
  entryFile: string;
  bundledItem: Tag;
  controllersMap: string;
};

export let getNames = (args: any): Names => {
  return {
    build: {
      bundledItem: new Tag('bundled-item', './.bundled-item.js'),
      controllersMap: './.controllers-map.js',
      entryFile: './.all-in-one.entry.js'
    },
    out: Out.build(args)
  };
};
