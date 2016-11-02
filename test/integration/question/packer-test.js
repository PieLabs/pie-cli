import Packer, {DEFAULTS} from '../../../src/question/packer';
import FrameworkSupport from '../../../src/framework-support';
import Question from '../../../src/question';
import { expect } from 'chai';
import { resolve } from 'path';
import fs from 'fs-extra';
import path from 'path';
import temp from 'temp';

describe('Packer.pack', () => {

  let rootDir = resolve('./test/integration/example-questions/one');
  let componentsDir = resolve('./test/integration/example-components');
  let questionPath, question, frameworkSupport, packer;
  
  before(function (done) {

    this.timeout(50000);
    
    let tmpPath = temp.mkdirSync('packer-test');
    console.log('packer-test tmp: ', tmpPath);
    questionPath = path.join(tmpPath, 'example-questions', 'one');
    fs.copySync(rootDir, questionPath);
    fs.copySync(componentsDir, path.join(tmpPath, 'example-components'));

    frameworkSupport = FrameworkSupport.bootstrap([
      path.join(__dirname, '../../../src/framework-support/frameworks/react'),
      path.join(__dirname, '../../../src/framework-support/frameworks/less')
    ]);

    question = new Question(questionPath);
    packer = new Packer(question, frameworkSupport);

    packer.pack({keepBuildAssets: true, buildExample: true})
      .then(() => done())
      .catch((e) => {
        console.log(e.stack);
        done(e)
      })
  });

  it('builds ' + DEFAULTS.pieJs, () => {
    expect(fs.existsSync(path.join(questionPath, DEFAULTS.pieJs))).to.eql(true);
  });
});