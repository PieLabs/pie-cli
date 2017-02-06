import { setUpTmpQuestionAndComponents } from './integration-test-helper';
import { join } from 'path';
import { spawnSync } from 'child_process';

let getSamplesPath = () => {
  let envPath = process.env['PIE_CLI_IT_SAMPLES_PATH'];
  if (envPath) {
    spawnSync('rm', ['-fr', envPath]);
    spawnSync('mkdir', ['-p', envPath]);
  }
  return setUpTmpQuestionAndComponents('it-sample', envPath);
}

before(function (done) {
  console.log('[INTEGRATION-TEST] init...');
  this.timeout(40000);

  let sampleDataPath = getSamplesPath();

  global.it = {
    sample: {
      tmp: sampleDataPath,
      component: join(sampleDataPath, 'example-components/hello-world/'),
      demo: join(sampleDataPath, 'example-components/hello-world/docs/demo')
    }
  }
  done();
});