import _ from 'lodash';
import { buildLogger } from '../log-factory';
import { loadSupportModules } from './support-module';

let logger = buildLogger();

export class BuildConfig {

  constructor(modules) {
    logger.debug('[BuildConfig:constructor]', modules);
    this._modules = modules;
  }

  get npmDependencies() {
    return _.reduce(this._modules, (acc, c) => {
      return _.extend(acc, c.npmDependencies);
    }, {});
  }

  webpackLoaders(resolve) {
    return _.reduce(this._modules, (acc, c) => {
      let loadersFn = _.isFunction(c.webpackLoaders) ? c.webpackLoaders : () => [];
      return acc.concat(loadersFn(resolve));
    }, []);
  }
}

export default class FrameworkSupport {

  /**
   * @param frameworks - an array of objects that have a `support` function which returns {npmDependencies: , webpackLoaders: (resolve) => {}}
   */
  constructor(frameworks) {
    this.frameworks = frameworks;
  }

  buildConfigFromPieDependencies(dependencies) {

    let readSupport = (framework) => {
      if (!framework) {
        return;
      }


      if (_.isFunction(framework)) {
        return framework(dependencies);
      } else if (_.isFunction(framework.support)) {
        return framework.support(dependencies);
      } else if (_.isObject(framework)) {
        return framework;
      }
    }

    let rawModules = _(this.frameworks).map(readSupport).compact().value();
    return new BuildConfig(rawModules);
  }

  /**
   * @param _require - convert src at given path to an object (used for testing)
   */
  static bootstrap(dir, modules) {
    return loadSupportModules(dir, modules)
      .then( loaded => new FrameworkSupport(loaded));
  };

}