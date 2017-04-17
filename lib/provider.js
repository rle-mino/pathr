'use babel';

import fs from 'fs';
import fuzzy from 'fuzzy';
import nodepath from 'path';

const getFilePath = fullFilePath => fullFilePath.match(/(.*\/)/)[0];

const getRequestPath = (line) => {
  /*
  * match returns an array,
  * just get the first value in the array
  * with the `'`
  */
  const [path] = line.match(/'((\.\/)|(\.\.\/)).*'/);

  const withoutQuotes = path.slice(1, path.length - 1);

  console.log(withoutQuotes, withoutQuotes.match(/(.*\/)/));
  return withoutQuotes.match(/(.*\/)/)[0];
}

const getRequestString = (line) => {
  const request = line.match(/\/[^/]*'/);
  return request.slice(1, request.length - 1);
}

const getType = (stat) => {
  if (stat.isFile()) return 'file';
  if (stat.isDirectory()) return 'directory';
  if (stat.isBlockDevice()) return 'block device';
  if (stat.isCharacterDevice()) return 'character device';
  if (stat.isSymbolicLink()) return 'symbolic link';
  if (stat.isFIFO()) return 'FIFO';
  if (stat.isSocket()) return 'socket';
}

const formatResult = path => file => {
  const separator = path[path.length - 1] === '/' ? '' : '/';

  const stat = fs.lstatSync(`${path}${separator}${file}`);
  const type = getType(stat);

  return {
    // remove the extension
    text: nodepath.basename(file, nodepath.extname(file)),
    displayText: file,
    rightLabelHTML: type,
  };
}

class Provider {
  constructor() {

    // autocomplete+
    this.selector = '.source.js';
    this.inclusionPriority = 1;
    this.suggestionPriority = 2;
    this.excludeLowerPriority = false;
  }

  getSuggestions({ editor, bufferPosition: { row } }) {

    return new Promise((resolve, reject) => {
      const { lines, file: { path: fullFilePath } } = editor.getBuffer();
      const line = lines[row];

      /*
      * resolves an empty array if the line looks like
      * `import * from * './'`
      */
      if (!line.match(/^import.*from\s.*'((.\/)|(..\/))/)) resolve([])
      else {
        const requestPath = getRequestPath(line);

        const requestString = getRequestString(line);

        const filePath = getFilePath(fullFilePath);

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
          const suggestions = results.map(formatResult(searchPath));

          resolve(suggestions);
        })
      }
    })
  }
}

export default new Provider();
