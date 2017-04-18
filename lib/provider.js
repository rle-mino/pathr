'use babel';

import fs from 'fs';
import fuzzy from 'fuzzy';
import nodepath from 'path';
import * as RE from './regularExpression';

class Provider {
  constructor() {

    // autocomplete+
    this.selector = '.source.js';
    this.inclusionPriority = 1;
    this.suggestionPriority = 2;
    this.excludeLowerPriority = false;
  }

  getFilePath = fullFilePath => fullFilePath.match(RE.withoutFilename)[0];

  getRequestPath = (line) => {
    /*
    * match returns an array,
    * just get the first value in the array
    * with the `'`
    */
    const [path] = line.match(RE.insideQuotes);

    const withoutQuotes = path.slice(1, path.length - 1);

    return withoutQuotes.match(RE.withoutFilename)[0];
  }

  getRequestString = (line) => {
    const request = line.match(RE.onlyFilename)[0];
    return request.slice(1, request.length - 1);
  }

  getType = (stat) => {
    if (stat.isFile()) return 'file';
    if (stat.isDirectory()) return 'directory';
    if (stat.isBlockDevice()) return 'block device';
    if (stat.isCharacterDevice()) return 'character device';
    if (stat.isSymbolicLink()) return 'symbolic link';
    if (stat.isFIFO()) return 'FIFO';
    if (stat.isSocket()) return 'socket';
  }

  formatResult = path => ({ string: file }) => {
    const separator = path[path.length - 1] === '/' ? '' : '/';

    const stat = fs.lstatSync(`${path}${separator}${file}`);
    const type = this.getType(stat);

    return {
      // remove the extension
      text: nodepath.basename(file, nodepath.extname(file)),
      displayText: file,
      rightLabelHTML: type,
    };
  }

  isQuote = (line, i) => (
    (line[i] === '\'' || line[i] === '\"') &&
    i - 1 >= 0 &&
    line[i - 1] !== '\\'
  )

  surrounded = (line, index) => {
    let inside = false;

    for (let i = 0; i < index; i++) {
      if (this.isQuote(line, i)) {
        inside = !inside;
      }
    }
    return inside;
  }

  getSuggestions({ editor, bufferPosition: { row, column }, prefix }) {

    return new Promise((resolve, reject) => {
      const { lines, file: { path: fullFilePath } } = editor.getBuffer();
      const line = lines[row];

      if (
        !line.match(RE.importFrom) &&
        !line.match(RE.require)
      ) resolve([])
      else if (this.surrounded(line, column)) {
        const requestPath = this.getRequestPath(line);

        const requestString = this.getRequestString(line);

        const filePath = this.getFilePath(fullFilePath);

        const separator = filePath[filePath.length - 1] === '/' ? '' : '/';

        const searchPath = `${filePath}${separator}${requestPath}`;

        // use async readdir to make sure we don't block the main process
        fs.readdir(searchPath, (err, files) => {
          if (err) {
            return console.error(err)
            resolve([]);
          }

          const results = fuzzy.filter(requestString, files);

          // use fuzzy to get wider results
          const suggestions = results.map(this.formatResult(searchPath));

          resolve(suggestions);
        })
      }
    })
  }
}

export default new Provider();
