'use babel';

import path from 'path';
import provider from '../lib/provider';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('core functions', () => {
  describe('getActualFilePath', () => {
    it('should remove filename from a path', () => {
      expect(provider.getActualFilePath('../foo/bar/foo/bar.js'))
        .toEqual('../foo/bar/foo/');
    });
  });

  describe('getRequestPath', () => {
    it('should getRequestPath', () => {
      expect(provider.getRequestPath('import a from \'./foo/bar/ok.ts\''))
        .toEqual('./foo/bar/');
    });
  });

  describe('getRequestString', () => {
    it('should getRequestString', () => {
      expect(provider.getRequestString('import a from \'./foo/bar.ts\''))
        .toEqual('bar.ts');
    });
  });

  describe('removeExtension', () => {
    it('should return true if both extensions are the same', () => {
      expect(provider.removeExtension('.ts', '.ts'))
        .toEqual(true);
    });

    it('should return false if extensions are different', () => {
      expect(provider.removeExtension('.js', '.ts'))
        .toEqual(false);
    });
  });

  describe('formatResult', () => {
    it('should return the autocomplete+ format object of a file', () => {
      const actualFileExtension = '.js';
      const file = {
        string: path.basename(__filename),
      };

      expect(provider.formatResult(__dirname, actualFileExtension)(file))
        .toEqual({
          text: 'pathr-core.test',
          displayText: 'pathr-core.test.js',
          rightLabelHTML: 'file',
        });
    });

    it('should add the extension if extensions are different', () => {
      const actualFileExtension = '.ts';
      const file = {
        string: path.basename(__filename),
      };

      expect(provider.formatResult(__dirname, actualFileExtension)(file))
        .toEqual({
          text: 'pathr-core.test.js',
          displayText: 'pathr-core.test.js',
          rightLabelHTML: 'file',
        });
    });
  });

  describe('isQuote', () => {
    it('should return true if it is a quote', () => {
      const test = 'import foo from \'./bar.js\'';
      expect(provider.isQuote(test, test.indexOf('\'')))
        .toEqual(true);
    });

    it('should return true if it is a quote', () => {
      const test = 'import foo from \'./bar.js\'';
      expect(provider.isQuote(test, 0)).toEqual(false);
    });
  });

  describe('isSurrounded', () => {
    it('should return true if index is inside quotes', () => {
      const test = 'import foo from \'./bar.js\'';
      expect(provider.isSurrounded(test, test.indexOf('\'') + 1))
        .toEqual(true);
    });

    it('should return false if index is outside quotes', () => {
      const test = 'import foo from \'./bar.js\'';
      expect(provider.isSurrounded(test, test.indexOf('\'') - 1))
        .toEqual(false);
    });
  });
});
