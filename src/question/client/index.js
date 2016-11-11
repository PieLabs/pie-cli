import { join, resolve as pathResolve } from 'path';
import FrameworkSupport from '../../framework-support';
import { buildLogger } from '../../log-factory';
import { removeFiles, softWrite } from '../../file-helper';
import NpmDir from '../../npm/npm-dir';
import _ from 'lodash';
import resolve from 'resolve';
import { build as buildWebpack } from '../../code-gen/webpack-builder';
import { configToJsString, writeConfig } from '../../code-gen/webpack-write-config';

const logger = buildLogger();

let clientDependencies = {
  'babel-core': '^6.17.0',
  'babel-loader': '^6.2.5',
  'style-loader': '^0.13.1',
  'css-loader': '^0.25.0',
  'webpack': '2.1.0-beta.21'
};

let baseConfig = (root) => {
  return {
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: 'style!css'
        }
      ]
    },
    resolveLoader: {
      root: pathResolve(join(root, 'node_modules')),
    },
    resolve: {
      root: pathResolve(join(root, 'node_modules')),
      extensions: ['', '.js', '.jsx']
    }
  };
};

export class BuildOpts {
  constructor(bundleName, pieBranch) {
    this.bundleName = bundleName;
    this.pieBranch = pieBranch;
  }

  static build(args) {
    args = args || {};
    return new BuildOpts(
      args.bundleName || 'pie.js',
      args.pieBranch || 'develop');
  }
}

export class ClientBuildable {
  constructor(config, support, opts, app) {
    this.config = config;
    this.opts = opts;
    this.app = app;
    this.frameworkSupport = support;
    this.npmDir = new NpmDir(this.dir);
  }

  get dir() {
    return this.config.dir;
  }

  pack(clean) {
    return this.prepareWebpackConfig(clean)
      .then((config) => this.bundle(config));
  }

  prepareWebpackConfig(clean) {
    let step = clean ? this.clean() : Promise.resolve();
    return step
      .then(() => this._install())
      .then(() => {
        let isValid = this.config.isConfigValid();
        logger.silly('isConfigValid() ? ', isValid)
        return isValid ? Promise.resolve() : Promise.reject('config is invalid');
      })
      .then(() => this.writeEntryJs())
      .then(() => this.webpackConfig());
  }

  get entryJsPath() {
    return join(this.dir, 'entry.js');
  }

  writeEntryJs() {
    let pieNames = _.map(this.config.pies, 'name');
    logger.silly('[writeEntryJs] pieNames: ', pieNames);
    let js = this.app.entryJs(_.map(this.config.pies, 'name'));
    logger.silly('[writeEntryJs] js: ', js);
    return softWrite(this.entryJsPath, js);
  }

  clean() {
    logger.debug('[clean]...', this.opts);
    let files = [this.opts.bundleName, this.opts.bundleName + '.map', 'entry.js'];
    logger.silly('[clean] files: ', files);
    return this.npmDir.clean()
      .then(() => removeFiles(this.dir, files));
  }

  webpackConfig() {
    let config = _.extend({
      context: this.dir,
      entry: this.entryJsPath,
      output: { filename: this.opts.bundleName, path: this.dir }
    }, baseConfig(this.dir));

    let frameworkLoaders = this._supportConfig.webpackLoaders((k) => resolve.sync(k, { basedir: this.dir }));

    logger.silly(`frameworkLoaders: ${JSON.stringify(frameworkLoaders)}`);

    config.module.loaders = config.module.loaders.concat(frameworkLoaders);
    return Promise.resolve(config);
  }

  bundle(config) {
    logger.silly('webpack config', configToJsString(config));

    if (process.env.WRITE_WEBPACK_CONFIG) {
      writeConfig(join(this.dir, 'webpack.config.js'), config);
    }

    return buildWebpack(config)
      .then(() => {
        return config.output.filename;
      });
  }

  /**
   * Initialise _supportConfig for use in later steps;
   */
  _buildFrameworkConfig() {

    let mergeDependencies = (acc, deps) => {
      return _.reduce(deps, (acc, value, key) => {
        if (acc[key]) {
          acc[key].push(value);
        }
        else {
          acc[key] = [value];
        }
        return acc;
      }, acc);
    };

    //Note: we can only read piePackages after an npm install.
    let appDependencyKeys = _.keys(this.app.dependencies(this.opts.pieBranch));
    logger.silly('[_buildFrameworkConfig] appDependencyKeys: ', appDependencyKeys);
    let appPackages = this.config.readPackages(appDependencyKeys);
    logger.silly('[_buildFrameworkConfig] appPackages: ', appPackages);
    let allPackages = _.concat(this.config.piePackages, appPackages);
    logger.silly('[_buildFrameworkConfig] allPackages: ', allPackages);

    let merged = _(allPackages).map('dependencies').reduce(mergeDependencies, {});

    logger.silly('[_buildFrameworkConfig] merged dependencies that need support: ', JSON.stringify(merged));
    this._supportConfig = this.frameworkSupport.buildConfigFromPieDependencies(merged);
    return Promise.resolve();
  }

  _install() {
    let dependencies = _.extend({},
      clientDependencies,
      this.config.npmDependencies,
      this.app.dependencies(this.opts.pieBranch));

    logger.silly('[_install] dependencies: ', dependencies);

    return this.npmDir.install(dependencies)
      .then(() => this._buildFrameworkConfig())
      .then(() => this._installFrameworkDependencies());
  }

  _installFrameworkDependencies() {

    if (!this._supportConfig) {
      return Promise.reject(new Error('no support config - has it been initialised?'));
    }

    logger.silly('supportConfig: ', JSON.stringify(this._supportConfig.npmDependencies));

    return this.npmDir.installMoreDependencies(this._supportConfig.npmDependencies, { save: true });
  }
}