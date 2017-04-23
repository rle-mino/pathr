'use babel';

import provider from '../lib/provider';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('Pathr', () => {
  const actual = __filename;

  it('should return an empty array if it is not a known pattern', (done) => {
    const params = {
      editor: {
        getBuffer: () => ({
          lines: [
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod',
            'Lorem ipsum dolor consectetur adipisicing elit, sed do eiusmod sit amet',
          ],
          file: {
            path: actual,
          }
        }),
      },
      bufferPosition: {
        row: 0,
        column: 0,
      },
    }
    provider.getSuggestions(params)
      .then((results) => {
        expect(results).toEqual([])
        done()
      })
  })

  it('from \'./', (done) => {
    const params = {
      editor: {
        getBuffer: () => ({
          lines: [
            'import a from \'./\'',
          ],
          file: {
            path: actual,
          },
        }),
      },
      bufferPosition: {
        row: 0,
        column: 15,
      },
    }
    provider.getSuggestions(params)
      .then((results) => {
        expect(results).toEqual([
          {
            "displayText": "pathr-regex.test.js",
            "rightLabelHTML": "file",
            "text": "pathr-regex.test",
          },
          {
            "displayText": "pathr-spec.test.js",
            "rightLabelHTML": "file",
            "text": "pathr-spec.test",
          },
          {
            "displayText": "pathr-view-spec.js",
            "rightLabelHTML": "file",
            "text": "pathr-view-spec",
          }]
        )
        done()
      })
  })

  it('from \'../', (done) => {
    const params = {
      editor: {
        getBuffer: () => ({
          lines: [
            'import a from \'../\'',
          ],
          file: {
            path: actual,
          },
        }),
      },
      bufferPosition: {
        row: 0,
        column: 15,
      },
    }
    provider.getSuggestions(params)
      .then((results) => {
        expect(results.length).toBeGreaterThan(0)
        done()
      })
  })

  it('from \'/', (done) => {
    const params = {
      editor: {
        getBuffer: () => ({
          lines: [
            'import a from \'/\'',
          ],
          file: {
            path: actual,
          },
        }),
      },
      bufferPosition: {
        row: 0,
        column: 15,
      },
    }
    provider.getSuggestions(params)
      .then((results) => {
        expect(results.length).toBeGreaterThan(0)
        done()
      })
  })

});
