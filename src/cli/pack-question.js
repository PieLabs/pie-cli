import { buildLogger } from '../log-factory';
import Question from '../question';
import CliCommand from './cli-command';
import { resolve, join } from 'path';
import ExampleApp from '../example-app';
import { softWrite } from '../file-helper';
import { removeSync } from 'fs-extra';
import _ from 'lodash';
import FrameworkSupport from '../framework-support';

const logger = buildLogger();

export class PackQuestionOpts {
  constructor(dir, clean, buildExample, exampleFile) {
    this.dir = dir;
    this.clean = clean;
    this.buildExample = buildExample;
    this.exampleFile = exampleFile;
  }

  static build(args) {

    if (args.keepBuildAssets) {
      logger.error('TODO: plug keepBuildAssets back in');
    }

    return new PackQuestionOpts(
      args.dir || process.cwd(),
      args.clean === 'true' || args.clean === true,
      args.buildExample !== 'false' && args.buildExample !== false,
      args.exampleFile || 'example.html');
  }
}

class PackQuestionCommand extends CliCommand {
  constructor() {
    super('pack-question', 'generate a question package');
  }

  run(args) {
    let packOpts = PackQuestionOpts.build(args);
    let dir = resolve(packOpts.dir);
    let support = args.support ? (_.isArray(args.support) ? args.support : [args.support]) : [];
    support = _.map(support, (s) => resolve(join(dir, s)));
    support = support.concat(exampleApp.frameworkSupport());

    let exampleApp = new ExampleApp();

    return FrameworkSupport.bootstrap(support)
      .then(frameworkSupport => {
        let questionOpts = Question.buildOpts(args);
        let question = new Question(dir, questionOpts, frameworkSupport, exampleApp);

        return question.pack(packOpts.clean)
          .then((result) => {
            logger.debug('pack result: ', result);

            if (packOpts.buildExample) {
              let paths = {
                client: result.client,
                controllers: result.controllers.filename
              }

              let ids = {
                controllers: result.controllers.library
              }

              let markup = exampleApp.staticMarkup(paths, ids, question.config.markup, question.config.config);

              logger.silly('markup: ', markup);

              let examplePath = join(dir, packOpts.exampleFile);

              if (packOpts.clean) {
                removeSync(examplePath);
              }

              return softWrite(examplePath, markup);
            }
          });
      });
  }
}

let cmd = new PackQuestionCommand();
exports.match = cmd.match.bind(cmd);
exports.usage = cmd.usage;
exports.summary = cmd.summary;
exports.run = cmd.run.bind(cmd);