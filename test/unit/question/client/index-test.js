import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { assert, stub, spy } from 'sinon';
import _ from 'lodash';

describe('client', () => {
  let index,
    npmDirConstructor,
    npmDirInstance,
    removeFiles,
    frameworkSupport,
    emptyApp,
    config,
    filterLs;

  beforeEach(() => {

    config = {
      dir: 'dir',
      valid: stub().returns(true)
    }

    emptyApp = {
      frameworkSupport: stub().returns([]),
      dependencies: () => []
    }

    npmDirInstance = {
      clean: stub().returns(Promise.resolve()),
      ls: stub().returns(Promise.resolve({}))
    };

    npmDirConstructor = stub().returns(npmDirInstance);

    frameworkSupport = {
      bootstrap: stub().returns(frameworkSupport)
    };

    filterLs = {
      filterFirstLevelDependencies: stub().returns([])
    }

    index = proxyquire('../../../../lib/question/client', {
      '../../npm/npm-dir': {
        default: npmDirConstructor
      },
      '../../npm/filter-ls': filterLs,
      '../../framework-support': {
        default: frameworkSupport
      }
    });
  });

  describe('BuildOpts', () => {

    let BuildOpts;

    beforeEach(() => {
      BuildOpts = index.BuildOpts;
    });

    it('builds with default pieBranch', () => {
      expect(BuildOpts.build().pieBranch).to.eql('develop');
    });

    it('builds with default bundleName', () => {
      expect(BuildOpts.build().bundleName).to.eql('pie.js');
    });
  });

  describe('ClientBuildable', () => {

    let ClientBuildable, buildable;

    beforeEach(() => {
      ClientBuildable = index.ClientBuildable;
    });

    describe('constructor', () => {
      beforeEach(() => {
        buildable = new ClientBuildable(config, [], { bundleName: 'pie.js' }, emptyApp);
      });

      it('calls new NpmDir', () => {
        assert.calledWith(npmDirConstructor, 'dir');
      });

    });

    describe('pack', () => {
      let buildable;
      beforeEach((done) => {
        buildable = new ClientBuildable(config, [], { bundleName: 'pie.js' }, emptyApp);
        buildable.prepareWebpackConfig = stub().returns(Promise.resolve());
        buildable.bundle = stub().returns(Promise.resolve());
        buildable.pack()
          .then(done.bind(null, null))
          .catch(done);
      });

      it('calls prepareWebpackConfig', () => {
        assert.called(buildable.prepareWebpackConfig);
      });

      it('calls bundle', () => {
        assert.called(buildable.bundle);
      });
    });

    describe('prepareWebpackConfig', () => {
      let buildable;
      beforeEach((done) => {
        buildable = new ClientBuildable(config, [], { bundleName: 'pie.js' }, emptyApp);
        buildable.clean = stub().returns(Promise.resolve());
        buildable._install = stub().returns(Promise.resolve());
        buildable.writeEntryJs = stub().returns(Promise.resolve());
        buildable.webpackConfig = stub().returns(Promise.resolve());
        buildable.config.isConfigValid = stub().returns(true);
        buildable.prepareWebpackConfig()
          .then(done.bind(null, null))
          .catch(done);
      });

      it('calls _install', () => {
        assert.called(buildable._install);
      });

      it('calls writeEntryJs', () => {
        assert.called(buildable.writeEntryJs);
      });

      it('calls webpackConfig', () => {
        assert.called(buildable.webpackConfig);
      });

      it('calls isConfigValid', () => {
        assert.called(buildable.config.valid);
      });

    });

    describe('_buildFrrameworkConfig', () => {
      let buildable, filtered;
      beforeEach((done) => {

        let config = {
          dir: 'dir',
          valid: () => true
        };

        filtered = [{ a: '1.0.0' }];
        filterLs.filterFirstLevelDependencies.returns(filtered);
        emptyApp.dependencies = stub().returns({ appDependency: '1.0.0' });

        buildable = new ClientBuildable(config, [], { bundleName: 'pie.js', pieBranch: 'develop' }, emptyApp);
        buildable.frameworkSupport = {
          buildConfigFromPieDependencies: stub().returns({ _mockSupportConfig: true })
        }

        buildable._buildFrameworkConfig()
          .then(() => {
            done();
          })
          .catch(done);
      });

      it('calls filterFirstLevelDependencies', () => {
        assert.calledWith(filterLs.filterFirstLevelDependencies, {}, ['appDependency']);
      });

      it('calls buildConfigFromPieDependencies', () => {
        assert.calledWith(buildable.frameworkSupport.buildConfigFromPieDependencies, filtered);
      });

      it('sets _supportConfig', () => {
        expect(buildable._supportConfig).to.eql({ _mockSupportConfig: true });
      });

      it('call app.dependencies with pieBranch', () => {
        assert.calledWith(emptyApp.dependencies, 'develop');
      })
    });

    describe('writeEntryJs', () => {
      it('todo', () => {});
    });

    describe('buildInfo', () => {

      it('returns the build info', () => {
        expect(buildable.buildInfo).to.eql({
          dir: buildable.dir,
          buildOnly: ['entry.js', 'node_modules', 'package.json'],
          output: ['pie.js', 'pie.js.map']
        });
      });
    });

    describe('webpackConfig', () => {

      let buildable, loader;

      beforeEach((done) => {
        loader = { test: /Iamaloader/ };

        buildable = new ClientBuildable(config, [], { bundleName: 'pie.js' }, emptyApp);
        buildable._supportConfig = {
          webpackLoaders: stub().returns([loader])
        }
        buildable.webpackConfig()
          .then((c) => {
            config = c;
            done();
          })
          .catch(done);
      });

      it('calls webpackLoaders', () => {
        assert.called(buildable._supportConfig.webpackLoaders);
      });

      it('returns config.context', () => {
        expect(config.context).to.eql('dir');
      });

      it('returns config.entry', () => {
        expect(config.entry).to.eql('dir/entry.js');
      });

      it('returns config.output.filename', () => {
        expect(config.output.filename).to.eql('pie.js');
      });

      it('returns config.output.path', () => {
        expect(config.output.path).to.eql('dir');
      });

      it('returns config.module.loaders[1]', () => {
        expect(config.module.loaders[1]).to.eql(loader);
      });
    });
  });

});