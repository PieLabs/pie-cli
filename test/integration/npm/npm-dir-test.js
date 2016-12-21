import NpmDir from '../../../lib/npm/npm-dir';
import temp from 'temp';
import fs from 'fs-extra';
import path from 'path';
import { expect } from 'chai';

describe('npm-dir', function () {

  this.timeout(4000);

  let tmpPath, npmDir;
  beforeEach((done) => {
    tmpPath = temp.mkdirSync('npm-dir-test');
    npmDir = new NpmDir(tmpPath);
    npmDir.install('tmp', { lodash: '*' })
      .then(() => done())
      .catch(done);
  });

  it('contains lodash in node_modules', () => {
    let lodashModule = path.join(tmpPath, 'node_modules/lodash');
    let stat = fs.statSync(lodashModule);
    expect(stat.isDirectory()).to.eql(true);
  });

});