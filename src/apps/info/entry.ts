import {
  configureDeclarations,
  controllerTargets,
  pieToConfigureMap,
  toDeclarations,
  Pkg
} from '../../install';
import { controllerDependency, sockJs } from '../src-snippets';

import { ElementDeclaration } from "../../code-gen/index";
import { isEmpty } from 'lodash';

export default function js(
  pkgs: Pkg[],
  sockPath: string) {

  const configDeclarations: ElementDeclaration[] = configureDeclarations(pkgs);
  const pieElementToConfigureMap = pieToConfigureMap(pkgs);
  const controllers = controllerTargets(pkgs);
  const declarations = toDeclarations(pkgs);

  return `
/** Auto generated by ${__filename} */

//pie controllers
let controllers = {};
${controllers.map(t => controllerDependency(t.pie, t.target)).join('\n')}


//config declarations
${configDeclarations.map(e => e.js).join('\n')}


//pie declarations
${declarations.map((e) => e.js).join('\n')}

// the catalog ui
import { defineRepoElements } from 'pie-catalog-client';

let initSock = ${sockJs()}

let init = () => {

  defineRepoElements() 
    .then(() => {
      let entry = document.querySelector('catalog-entry');
      entry.element = window.element;

      entry.config = window.orgRepo;

      if (!window.demo.config) {
        throw new Error('config is missing');
      }
      let demo = document.querySelector('catalog-demo');
      demo.configureMap = ${isEmpty(pieElementToConfigureMap) ? 'undefined' : JSON.stringify(pieElementToConfigureMap)};
      demo.config = window.demo.config;
      demo.controllers = controllers;
      demo.markup = window.demo.markup;
      demo.session = window.demo.session;

      setTimeout(() => {
        let c = document.querySelector('catalog-container');
        c.isLoading(false);
      }, 180);
    });

  initSock('${sockPath}');
}

document.addEventListener('DOMContentLoaded', () => {
  init();
}); `;
}
