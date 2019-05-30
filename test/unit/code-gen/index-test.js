import { expect } from 'chai';

describe('declaration', () => {

  let mod = require('../../../lib/code-gen');

  describe('ElementDeclaration', () => {
    describe('js', () => {
      it('returns a custom element declaration', () => {
        let d = new mod.ElementDeclaration('my-tag');
        expect(d.js).to.eql(`import MyTag from 'my-tag';\nif(!customElements.get('my-tag')){\ncustomElements.define('my-tag', MyTag);\n}`);
      });
    });
  });
});