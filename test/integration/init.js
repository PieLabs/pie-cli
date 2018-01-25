import { init } from 'log-factory';
import { join } from 'path';
import { setUpTmpQuestionAndComponents } from './integration-test-helper';
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
  init({ console: true, log: process.env.LOG_LEVEL || 'info' });
  let sampleDataPath = getSamplesPath();
  const cwd = join(sampleDataPath, 'example-components/hello-world');
  spawnSync('git', ['init'], { cwd });
  spawnSync('git', ['add', '.'], { cwd });
  spawnSync('git', ['commit', '.', '-m', '"msg"'], { cwd });
  const hashResult = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd });
  console.log(hashResult.stdout.toString());

  global.it = {
    sample: {
      tmp: sampleDataPath,
      component: join(sampleDataPath, 'example-components/hello-world/'),
      demo: join(sampleDataPath, 'example-components/hello-world/docs/demo')
    }
  }
  done();
});
