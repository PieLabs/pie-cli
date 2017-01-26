import { App, BuildOpts, ManifestOpts, ServeOpts } from '../types';
import { JsonConfig } from '../../question/config';
import { buildLogger } from '../../log-factory';
import { SupportConfig } from '../../framework-support';
import * as _ from 'lodash';
import { join, resolve } from 'path';
import * as pug from 'pug';
import { writeFileSync, writeJsonSync, readJsonSync, readFileSync } from 'fs-extra';
import * as webpack from 'webpack';
import * as express from 'express';
import * as archiver from 'archiver';
import { BuildStep, BaseApp, Tag, Out, Names, Compiler, build as buildApp, getNames } from '../base';
import { ReloadOrError, HasServer } from '../server/types';
import { existsSync } from 'fs-extra';
import { isGitRepo, tag, sha } from '../../git';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

export default class CatalogApp extends BaseApp {

  static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<App> {
    let dir = resolve(args.dir || process.cwd());
    if (!existsSync(join(dir, 'docs/demo'))) {
      throw new Error(`Can't find a 'docs/demo' directory in path: ${dir}. Is this a pie directory?`);
    }
    let config = new JsonConfig(join(dir, 'docs/demo'));
    return loadSupport(config)
      .then(s => {
        return new CatalogApp(args, dir, config, s, getNames(args));
      })
  }

  private template: pug.compileTemplate;

  constructor(args: any, private pieRoot: string, config: JsonConfig, support: SupportConfig, names: Names) {
    super(args, config, support, names);
    logger.debug('new CatalogApp..');
    this.template = pug.compileFile(templatePath, { pretty: true });
  }


  protected addExtrasToArchive(archive: archiver.Archiver): void {
    archive.file(resolve(join(this.pieRoot, 'package.json')), { name: 'pie-pkg/package.json' });
    archive.file(resolve(join(this.pieRoot, 'README.md')), { name: 'pie-pkg/README.md' });
    archive.directory(resolve(join(this.pieRoot, 'docs/schemas')), 'schemas');
  }

  protected mkServer(app: express.Application): ReloadOrError & HasServer {
    throw new Error('not supported');
  }

  protected serverMarkup(): string {
    return this.fileMarkup();
  }

  protected updateConfig(c: any): any {

    let externals = _.merge(c.externals, {
      'lodash': '_',
      'lodash/map': '_.map',
      'react': 'React',
      'react-dom': 'ReactDOM',
      'react-addons-transition-group': 'React.addons.TransitionGroup',
      'react/lib/ReactTransitionGroup': 'React.addons.TransitionGroup',
      'react/lib/ReactCSSTransitionGroup': 'React.addons.CSSTransitionGroup'
    });

    c.externals = externals;
    logger.debug('[updateConfig] c: ', c);
    return c;
  }

  protected get archiveIgnores() {
    return _.concat(super.archiveIgnores, [
      'config.json',
      'index.html'
    ]);
  }

  private get defaultJs(): string[] {
    return [
      '//cdnjs.cloudflare.com/ajax/libs/react/15.4.1/react-with-addons.js',
      '//cdnjs.cloudflare.com/ajax/libs/react/15.4.1/react-dom.js',
      '//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.js'];
  }

  protected fileMarkup(): string {
    return this.template({
      js: _.concat(this.defaultJs, this.support.externals.js || [], [this.names.out.completeItemTag.path]),
      markup: this.names.out.completeItemTag.tag,
    });
  }

}
