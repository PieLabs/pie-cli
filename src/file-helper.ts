import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { existsSync, writeFile } from 'fs-extra';
import { buildLogger } from './log-factory';

const logger = buildLogger();

export function removeFiles(root, files) {
  let promises = _.map(files, (f) => new Promise((resolve, reject) => {
    let filepath = path.join(root, f);
    fs.remove(filepath, (err) => err ? reject(err) : resolve(filepath));
  }));
  return Promise.all(promises)
    .then((results) => {
      logger.silly(`removed: from ${root}: ${_.map(results, (f: string) => path.basename(f)).join("\n")}`);
      return results;
    });
}

export function softWrite(path, src) {
  if (existsSync(path)) {
    return Promise.resolve(path);
  } else {
    return new Promise((resolve, reject) => {
      writeFile(path, src, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(path);
        }
      });
    });
  }
}
