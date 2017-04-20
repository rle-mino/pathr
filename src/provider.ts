/// <reference path="../node_modules/fuzzy/lib/fuzzy.d.ts" />
'use babel';

import * as fs from 'fs';
import * as fuzzy from 'fuzzy';
import * as nodepath from 'path';
import * as RE from './regularExpression';

interface Point {
  column:number;
  row:number;
}

interface File {
  path:string;
}

interface AutocompleteSuggest {
  text:string;
  displayText:string;
  rightLabelHTML:string;
}

interface SuggestionParams {
  editor:any;
  bufferPosition:Point;
  prefix:string;
}

class Provider {
  selector:string;
  inclusionPriority:number;
  suggestionPriority:number;
  excludeLowerPriority:boolean;

  constructor() {

    // autocomplete+
    this.selector = '.source.js, .source.jsx, .source.ts, .source.tsx';
    this.inclusionPriority = 1;
    this.suggestionPriority = 2;
    this.excludeLowerPriority = false;
  }

  getFilePath = (fullFilePath:string):string => fullFilePath.match(RE.withoutFilename)[0];

  getRequestPath = (line:string):string => {
    /*
    * match returns an array,
    * just get the first value in the array
    * with the `'`
    */
    const [path] = line.match(RE.insideQuotes);

    const withoutQuotes = path.slice(1, path.length - 1);

    return withoutQuotes.match(RE.withoutFilename)[0];
  }

  getRequestString = (line:string):string => {
    const request = line.match(RE.onlyFilename)[0];
    return request.slice(1, request.length - 1);
  }

  getType = (stat:fs.Stats):string => {
    if (stat.isFile()) return 'file';
    if (stat.isDirectory()) return 'directory';
    if (stat.isBlockDevice()) return 'block device';
    if (stat.isCharacterDevice()) return 'character device';
    if (stat.isSymbolicLink()) return 'symbolic link';
    if (stat.isFIFO()) return 'FIFO';
    if (stat.isSocket()) return 'socket';
  }

  formatResult = (path:string) => ({ string: file }:{ string:string }):AutocompleteSuggest => {
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

  isQuote = (line:string, i:number):boolean => (
    (line[i] === '\'' || line[i] === '\"') &&
    i - 1 >= 0 &&
    line[i - 1] !== '\\'
  );

  surrounded = (line:string, index:number):boolean => {
    let inside:boolean = false;

    for (let i = 0; i < index; i = i + 1) {
      if (this.isQuote(line, i)) {
        inside = !inside;
      }
    }
    return inside;
  }

  getSuggestions = ({ editor, bufferPosition: { row, column }, prefix }:SuggestionParams) => {

    return new Promise((resolve, reject) => {
      const {
        lines,
        file: { path: fullFilePath },
      }:{
        lines:[string],
        file:File,
      } = editor.getBuffer();
      const line = lines[row];

      if (
        !line.match(RE.importFrom) &&
        !line.match(RE.requ)
      ) {
        resolve([]);
      } else if (this.surrounded(line, column)) {
        // '[./a/b/c/d/]couou'
        const requestPath = this.getRequestPath(line);

        // './a/b/c/d/[couou]'
        const requestString = this.getRequestString(line);

        // path to buffered file
        const filePath = this.getFilePath(fullFilePath);

        const separator = filePath[filePath.length - 1] === '/' ? '' : '/';

        const searchPath:string =
          requestPath[0] === '/' ?
            requestPath
            :
            `${filePath}${separator}${requestPath}`;

        // use async readdir to make sure we don't block the main process
        fs.readdir(searchPath, (err, files) => {
          if (err) {
            resolve([]);
            return console.error(err);
          }

          if (requestString[0] !== '.') {
            files = files.filter(file => file[0] !== '.');
          }

          const results = fuzzy.filter(requestString, files);

          // use fuzzy to get wider results
          const suggestions = results.map(this.formatResult(searchPath));

          resolve(suggestions);
        });
      }
    });
  }
}

export default new Provider();
