import jsesc from 'jsesc';
import fs from 'fs-extra';
import path from 'path';
import {removeFiles} from '../file-helper';

let mkExampleMarkup = (markup, model) => `
<!doctype html>
<html>
  <head>
    <!-- lodash is one of the supported libs on the controller side -->
    <script src="//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.16.2/lodash.js" type="text/javascript"></script>
    <script src="pie.js" type="text/javascript"></script>
    <script src="controllers.js" type="text/javascript"></script>
    <script type="text/javascript">

      document.addEventListener('DOMContentLoaded', function(){

        env = {mode: 'gather'};
        model = ${jsesc(model)};
        session = [];
        
        var player = document.querySelector('pie-player');

        player.addEventListener('pie-player-ready', function(event){
          player.controller = new pie.Controller(model.pies, pie.controllerMap);
          player.env = env;
          player.session = session;
        });
      });
    </script>
  </head>
  <body>
    <pie-player>
    ${markup}
    </pie-player>
  </body>
</html>
`;

export function build(root, srcFile, resultName, configFile){
  let playerMarkup = fs.readFileSync(path.join(root, srcFile), {encoding: 'utf8'});
  let model = fs.readJsonSync(path.join(root, configFile));
  let example = mkExampleMarkup(playerMarkup, model);
  let outpath = path.join(root, resultName);
  fs.writeFileSync(outpath, example, {encoding: 'utf8'});
  return Promise.resolve(outpath);
}

export function clean(root, markupName){
  return removeFiles(root, [markupName]);
}