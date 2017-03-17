import * as _ from 'lodash';
import * as webpack from 'webpack';

import { buildLogger } from 'log-factory';
import { join } from 'path';
import { writeConfig } from './webpack-write-config';

const logger = buildLogger();

export type BuildResult = { stats: webpack.compiler.Stats, duration: number };

export function build(config, dumpConfig?: string): Promise<BuildResult> {

  if (dumpConfig) {
    writeConfig(join(config.context, dumpConfig), config);
  }

  return new Promise((resolve, reject) => {

    webpack(config, (err, stats) => {
      if (err) {
        logger.error(err.message);
        reject(err);
      } else if (stats.hasErrors()) {

        const out = stats.toJson({ errorDetails: true });
        _.forEach(out.errors, (e) => logger.error(e));
        reject(new Error('Webpack build errors - see the logs'));
      } else {
        const endTime = (stats as any).endTime;
        const startTime = (stats as any).startTime;
        const duration = endTime - startTime;
        logger.info(`webpack compile done. duration (ms): ${duration}`);
        resolve({ stats, duration });
      }
    });
  });
}
