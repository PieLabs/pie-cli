import Question, { CleanMode } from '../question';
import { resolve } from 'path';
import { buildLogger } from '../log-factory';
import { join } from 'path';
import { removeSync } from 'fs-extra';
import { PackOpts } from './pack';
import CliCommand from './cli-command';

let logger = buildLogger();

class CleanCommand extends CliCommand {
  constructor() {
    super('clean', 'Clean the cruft generated by pack');
  }

  run(args) {
    logger.debug('[run] args: ', args);
    let dir = resolve(args.dir || process.cwd());

    //Note: we don't need an app when cleaning
    let emptyApp = {
      frameworkSupport: () => []
    };

    //Note: we don't need framework support for a clean
    let noExternalSupport = [];
    let questionOpts = Question.buildOpts(args);
    let packOpts = PackOpts.build(args);
    let question = new Question(dir, questionOpts, noExternalSupport, emptyApp);
    return question.clean(CleanMode.ALL)
      .then(() => removeSync(join(dir, packOpts.exampleFile)))
      .then(() => "clean complete")
  }
}
let cmd = new CleanCommand();
export default cmd;