import * as _ from 'lodash';
import CliCommand from './cli-command';

export class Help extends CliCommand {
  constructor(private rootCmd, private handlers: CliCommand[]) {
    super('help', 'show help');
  }

  match(args) {
    return args.help || args.h || args._.indexOf('help') !== -1;
  }

  run(args) {
    if (args._.indexOf('help') !== -1) {
      args._ = _.difference(args._, ['help']);

      let cmd = _.find(this.handlers, (h) => h.match(args));

      console.log('common options:\n\t --log-level\n');

      if (cmd && cmd.usage) {
        console.log(cmd.usage);
      }
    } else {
      console.log(`Usage:`);
      let usage = _(this.handlers).map((h) => `\t${h.summary}`).join('\n');
      console.log(usage);
      console.log('--');
      console.log(`you can also run: \n\t${this.rootCmd} help $command-name\nfor more detail.`);
    }
    return Promise.resolve('--');
  }
}
