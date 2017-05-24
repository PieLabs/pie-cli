import * as _ from 'lodash';

import { assert, match, spy, stub } from 'sinon';

import { Base } from '../helper';
import { expect } from 'chai';
import { path as p } from '../../../../lib/string-utils';
import path from 'path';
import proxyquire from 'proxyquire';

const ROOT = '../../../../lib';

describe('index', () => {

  let DefaultApp, instance, mod, deps, args, jsonConfig, supportConfig, result;

  beforeEach(() => {
    deps = {
      './src-generators': {
        client: stub().returns('//client js'),
        controllers: stub().returns('//controllers js'),
        allInOne: stub().returns('//all-in-one')
      },
      '../../code-gen': {
        buildWebpack: stub().returns(Promise.resolve({})),
        writeConfig: stub()
      },
      'fs-extra': {
        writeFileSync: stub()
      },
      '../common': {
        webpackConfig: stub().returns({ output: {} })
      },
      '../src-snippets': {
        targetsToElements: stub().returns('')
      }
    };

    mod = proxyquire(`${ROOT}/apps/default`, deps);
    DefaultApp = mod.default;
    args = {};
    jsonConfig = {
      dir: 'dir',
      markup: '<html>',
      weights: [],
      langs: [],
      declarations: [],
      models: stub().returns([])
    };
    supportConfig = {
      externals: {
        js: []
      }
    };
    instance = new DefaultApp(args, jsonConfig, supportConfig);
  });

  describe('constructor', () => {
    it('constructs', () => {
      expect(instance).not.to.be.undefined;
    });
  });

  describe('build', () => {
    beforeEach(() => {
      instance.installer = {
        install: stub().returns(Promise.resolve({ controllers: [], configure: [] }))
      }
      instance.buildClient = stub().returns(Promise.resolve(['client.js']));
      instance.buildControllers = stub().returns(Promise.resolve(['controllers.js']));
      instance.buildConfigure = stub().returns(Promise.resolve(['configure.js']));
      return instance.build({}).then(r => result = r);
    });

    it('calls installer.install', () => {
      assert.called(instance.installer.install);
    });

    it('calls buildClient', () => {
      assert.called(instance.buildClient);
    });

    it('calls buildControllers', () => {
      assert.calledWith(instance.buildControllers, []);
    });

    it('returns the files', () => {
      expect(result).to.eql(['client.js', 'controllers.js', 'configure.js']);
    });

  });

  describe('build with include complete', () => {
    beforeEach(() => {
      instance = new DefaultApp({ c: true }, jsonConfig, supportConfig);
      instance.installer = {
        install: stub().returns(Promise.resolve({ controllers: [], configure: [] }))
      }
      instance.buildClient = stub().returns(Promise.resolve(['client.js']));
      instance.buildControllers = stub().returns(Promise.resolve(['controllers.js']));
      instance.buildAllInOne = stub().returns(Promise.resolve(['all-in-one.js']));
      instance.buildExample = stub().returns(Promise.resolve(['example.html']));
      return instance.build({});
    });

    it('calls buildAllInOne', () => {
      assert.calledWith(instance.buildAllInOne, []);
    });

    it('calls buildExample', () => {
      assert.called(instance.buildExample);
    });
  });

  describe('build with addPlayerAndControlPanel', () => {
    beforeEach(() => {
      instance = new DefaultApp({ c: false }, jsonConfig, supportConfig);
      instance.installer = {
        install: stub().returns(Promise.resolve({ controllers: [], configure: [] }))
      }
      instance.buildControllers = stub().returns(Promise.resolve(['controllers.js']));
      return instance.build({ addPlayerAndControlPanel: true });
    });

    it('calls generator.client with pie-player', () => {
      const call = deps['./src-generators'].client.firstCall;
      let arr = call.args[0];
      expect(_.some(arr, ed => ed.tag === 'pie-player')).to.be.true;
    });

    it('calls generator.client with pie-control-panel', () => {
      const call = deps['./src-generators'].client.firstCall;
      let arr = call.args[0];
      expect(_.some(arr, ed => ed.tag === 'pie-player')).to.be.true;
    });
  });

  describe('buildControllers', () => {
    let result;
    beforeEach(() => {
      return instance.buildControllers([]).then(r => result = r)
        .then(r => result = r);
    });

    it('calls generators.controllers', () => {
      assert.calledWith(deps['./src-generators'].controllers, []);
    });

    it('calls writeFileSync', () => {
      assert.calledWith(deps['fs-extra'].writeFileSync, p`dir/.pie/controllers.entry.js`);
    });

    it('calls webpackConfig', () => {
      assert.calledWith(deps['../common'].webpackConfig, match.object, match.object, 'controllers.entry.js', 'pie-controllers.js', match.string);
    });

    it('returns the result', () => {
      expect(result).to.eql(['pie-controllers.js']);
    });
  });

  describe('buildClient', () => {

    let result;
    beforeEach(() => {
      return instance.buildClient()
        .then(r => result = r);
    });

    it('calls generators.client', () => {
      assert.calledWith(deps['./src-generators'].client, []);
    });

    it('calls writeFileSync', () => {
      assert.calledWith(deps['fs-extra'].writeFileSync, p`dir/.pie/client.entry.js`);
    });

    it('calls webpackConfig', () => {
      assert.calledWith(deps['../common'].webpackConfig, match.object, match.object, 'client.entry.js', 'pie-view.js', match.string);
    });

    it('returns the result', () => {
      expect(result).to.eql(['pie-view.js']);
    });
  });

  describe('buildConfigure', () => {

    let mappings = { configure: [{ pie: 'my-pie', target: 'my-pie-target' }] };

    beforeEach(() => instance.buildConfigure(mappings));


    it('calls targetsToElements', () => {
      assert.calledWith(deps['../src-snippets'].targetsToElements, mappings.configure);
    });

    it('calls writeFileSync', () => {
      assert.calledWith(deps['fs-extra'].writeFileSync, p`dir/.pie/${DefaultApp.CONFIGURE_ENTRY}`);
    });

    it('calls webpackConfig', () => {
      assert.calledWith(deps['../common'].webpackConfig,
        match.object,
        match.object,
        DefaultApp.CONFIGURE_ENTRY,
        DefaultApp.CONFIGURE_BUNDLE,
        match.string);
    });

  });

  describe('buildAllInOne', () => {

    let result;
    beforeEach(() => {
      instance.installer = {
        dir: 'dir/.pie',
        dirs: {
          root: 'dir/.pie'
        },
        installedPies: []
      };
      return instance.buildAllInOne([])
        .then(r => result = r);
    });

    it('calls JsonConfig.pieModels', () => {
      assert.called(jsonConfig.models);
    });

    it('calls generators.allInOne', () => {
      assert.calledWith(deps['./src-generators'].allInOne, [], [], match.string, [], [], []);
    });

    it('calls writeFileSync', () => {
      assert.calledWith(deps['fs-extra'].writeFileSync, p`dir/.pie/all-in-one.entry.js`);
    });

    it('calls webpackConfig', () => {
      assert.calledWith(deps['../common'].webpackConfig, match.object, match.object, 'all-in-one.entry.js', 'pie-item.js', match.string);
    });

    it('returns the result', () => {
      expect(result).to.eql(['pie-item.js']);
    });
  });

  describe('buildExample', () => {
    beforeEach(() => {
      instance.template = stub().returns('template');
      return instance.buildExample();
    });

    it('calls template', () => {
      assert.calledWith(instance.template, { js: ['./pie-item.js'], markup: '<pie-item></pie-item>' });
    });

    it('calls writeFileSync', () => {
      assert.calledWith(deps['fs-extra'].writeFileSync, p`dir/example.html`, 'template', 'utf8');
    });
  });

  describe('generatedFiles', () => {
    it('returns the files that can be possible generated', () => {
      expect(DefaultApp.generatedFiles).to.eql(['pie-item.js', 'pie-view.js', 'pie-configure.js', 'pie-controllers.js', 'example.html']);
    });
  });
});