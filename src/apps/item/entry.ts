import * as _ from 'lodash';

import { ElementDeclaration } from '../../code-gen/declaration';

export default function js(
  declarations: ElementDeclaration[],
  controllerDependencies: { [key: string]: string },
  sockPath: string) {


  const controllerDep = (value, key) => `controllers['${key}'] = require('${key}-controller');`;

  return `
/** Auto generated by ${__filename} */

//pie controllers 
let controllers = {};
${_.map(controllerDependencies, controllerDep).join('\n')}

//pie declarations
${declarations.map(e => e.js).join('\n')}

// the catalog ui
import CatalogDemo from 'pie-catalog-client/src/catalog-demo';
customElements.define('catalog-demo', CatalogDemo);
import ControlPanel from 'pie-catalog-client/src/catalog-demo/control-panel';
customElements.define('control-panel', ControlPanel);

require('pie-catalog-client/src/common.less');
require('material-elements/src/select-field');

let initSock = (sockPath) => {
  console.log('init sock');

  let sock = new SockJS(sockPath);
    
  sock.onopen = function() {
    console.log('sock is open');
  };

  function tryToParse(d){
    try {
      return JSON.parse(d);
    } catch(e){
      return null;
    }
  }

  sock.onmessage = function(e) {
    console.log('sock message', e.data);
    let dataObj = tryToParse(e.data);
    if(dataObj.type === 'reload'){
      window.location.reload(false);
    } else if(dataObj.type == 'error'){
      //TODO - render the errors in the UI?
      alert('webpack errors have occured - check the logs');
    }
  };
    
  sock.onclose = function() {
    console.log('sock is closed');
  };        
}

let init = () => {

  let allPromises = [
    customElements.whenDefined('catalog-demo')
  ];

  Promise.all(allPromises)
    .then(() => {
      let demo = document.querySelector('catalog-demo');
      demo.config = window.demo.config;
      demo.controllers = controllers;
      demo.markup = window.demo.markup;
    });

    initSock('${sockPath}');
}

document.addEventListener('DOMContentLoaded', () => {
  init();
}); `;
}