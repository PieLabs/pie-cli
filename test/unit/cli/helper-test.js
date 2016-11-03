import { expect } from 'chai';
import {normalizeOpts} from '../../../src/cli/helper';

describe('normalizeOpts', () => {

  it('normalizes', () => {
    expect(normalizeOpts({
      'a-b': 'ab', 
      _ : []
    })).to.eql({aB: 'ab', _: []});
  });
});