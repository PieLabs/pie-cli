import { ElementDeclaration } from './../../../code-gen';
import { Model } from '../../../question/config';
import { PieTarget } from '../../../install';

export function allInOne(
  declarations: ElementDeclaration[],
  controllerMap: PieTarget[],
  markup: string,
  pieModels: Model[],
  weights: any,
  langs: any,
  scoringType: string = 'weighted'): string {

  return `
  import Controller from 'pie-controller';

  ${declarations.map(d => d.js).join('\n')}
  
  import PiePlayer from 'pie-player';
  customElements.define('pie-player', PiePlayer);
  import ControlPanel from 'pie-control-panel';
  customElements.define('pie-control-panel', ControlPanel);

  const controllerMap = {}; 
  ${controllerMap.map(t => `controllerMap['${t.pie}'] = require('${t.target}');`).join('\n')}
  
  export default class Bundled extends HTMLElement{

    constructor(){
      super();
    }
    
    connectedCallback(){

      let model = {
        weights: ${JSON.stringify(weights || [])},
        scoringType: '${scoringType}',
        models: ${JSON.stringify(pieModels)},
        langs: ${JSON.stringify(langs)}
      };
      
      let controller = new Controller(model, controllerMap);
      let env = { mode: 'gather' };
      let sessions = [];

      this.addEventListener('ready', (event) => {

        if(event.target.tagName.toLowerCase() !== 'pie-player'){
          return;
        }
        
        event.preventDefault();
        event.stopImmediatePropagation();

        let player = event.target;
        player.controller = controller;
        player.env(env)
          .then(() => player.sessions(sessions))

        let panel = this.querySelector('pie-control-panel');
        panel.env = env;

        controller.getLanguages().then(function (l) {
          panel.languages = l;
        }).catch(e => {
          console.error(e);
        });

        panel.addEventListener('envChanged', function (event) {
          const {env} = event.target;
          player.env(env)
            .then(() => {
              if (env.mode === 'evaluate') {
                player.outcomes()
                  .then(outcome => {
                    const {percentage, max} = outcome.summary;
                    const points = outcome.pies.reduce((total, p) => total + p.score, 0);
                    panel.score = \` Score: \${percentage}% Points: \${points}/ \${max}\`;
                  });
              } else {
                panel.score = '';
              }
            });
        });
      });
      
      this.innerHTML = \`

        <style>
          * {
            font-family: 'Roboto', sans-serif;
          }

          .control-panel-holder {
            display: flex;
            align-items: center;
            background-color: rgba(0,0,0,0.1);
            padding: 0;
            margin: 0;
            padding-left: 10px;
            border-radius: 3px;
            box-shadow: 0px 2px 4px 0px rgba(0,0,0,0.31);
            margin-bottom: 20px;
          }

          .control-panel-holder > label {
            text-transform: uppercase;
            font-size: 14px;
            color: rgba(0,0,0,0.5);
          } 

        </style>
        <div class="control-panel-holder">
          <label>Control Panel</label>
          <pie-control-panel></pie-control-panel> 
        </div>
        <pie-player>
          ${markup}
        </pie-player>
      \`;

    }
  }

  customElements.define('pie-item', Bundled);
  `;
};
