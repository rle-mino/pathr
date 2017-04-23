'use babel';

import * as RE from '../lib/regularExpression';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('regular expressions', () => {
  describe('withoutFilename', () => {
    it('should match', () => {
      const test = 'foo/bar.js'
      expect(test.match(RE.withoutFilename)[0]).toEqual('foo/')
    })

    it('should not match', () => {
      const test = 'foo';
      expect(test.match(RE.withoutFilename)).toEqual(null);
    })
  })

  describe('inside quotes', () => {
    it('should match', () => {
      const test = 'import foo from \'./bar\''
      expect(test.match(RE.insideQuotes)[0]).toEqual('\'./bar\'')
    })

    it('should not match', () => {
      const test = 'import foo from bar';
      expect(test.match(RE.insideQuotes)).toEqual(null);
    })
  })

  describe('onlyFilename', () => {
    it('should match', () => {
      const test = '\"foo/bar.js\"';
      expect(test.match(RE.onlyFilename)[0]).toEqual('/bar.js\"');
    })

    it('should not match', () => {
      const test = 'foo/';
      expect(test.match(RE.onlyFilename)).toEqual(null);
    })
  })

  describe('importFrom', () => {
    it('should match', () => {
      const test = 'import a from \'./foo/bar.js\'';
      expect(test.match(RE.importFrom)).not.toBeNull()
    })

    it('should not match', () => {
      const test = 'import a \'./foo\'';
      expect(test.match(RE.importFrom)).toBeNull();
    })
  })

});
