/// <reference path="../node_modules/fuzzy/lib/fuzzy.d.ts" />
'use babel';

import * as fs from 'fs';
import * as fuzzy from 'fuzzy';
import * as nodepath from 'path';
import * as RE from './regularExpression';
import {
  Point,
  File,
  AutocompleteSuggest,
  SuggestionParams,
  FilterResult,
} from './interfaces';

class Provider {
  selector:string;
  inclusionPriority:number;
  suggestionPriority:number;
  excludeLowerPriority:boolean;

  constructor() {

    // autocomplete+
    this.selector = '*';
    this.inclusionPriority = 1;
    this.suggestionPriority = 2;
    this.excludeLowerPriority = false;
  }

  getActualFilePath = (fullFilePath:string):string => fullFilePath.match(RE.withoutFilename)[0];

  getRequestPath = (line:string):string => {

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

  removeExtension = (extension:string, actualFileExtension:string):boolean =>
    extension === actualFileExtension;

  formatResult = (path:string, actualFileExtension:string) =>
    ({ string:file }:FilterResult):AutocompleteSuggest => {
      const separator = path[path.length - 1] === '/' ? '' : '/';

      const stat = fs.lstatSync(`${path}${separator}${file}`);
      const type = this.getType(stat);
      const extension = nodepath.extname(file);

      const text = this.removeExtension(extension, actualFileExtension) ?
        nodepath.basename(file, nodepath.extname(file))
        :
        file;

      return {
        text,
        displayText: file,
        rightLabelHTML: type,
      };
    }

  isQuote = (line:string, index:number):boolean => (
    (line[index] === '\'' || line[index] === '\"') &&
    index - 1 >= 0 &&
    line[index - 1] !== '\\'
  );

  isSurrounded = (line:string, index:number):boolean => {
    let inside:boolean = false;

    for (let i = 0; i < index; i = i + 1) {
      if (this.isQuote(line, i)) {
        inside = !inside;
      }
    }
    return inside;
  }

  getSuggestions = ({ editor, bufferPosition: { row, column } }:SuggestionParams) => {

    return new Promise((resolve, reject) => {
      const {
        lines,
        file: { path: fullFilePath },
      }:{
        lines:[string],
        file:File,
      } = editor.getBuffer();
      const line = lines[row];

      if (!line.match(RE.everywhere)) {
        resolve([]);
      } else if (this.isSurrounded(line, column)) {
        // import foo from '[./a/b/c/d/]bar'
        const path = this.getRequestPath(line);

        // './a/b/c/d/[bar]'
        const filename = this.getRequestString(line);

        const actualFilePath = this.getActualFilePath(fullFilePath);

        const actualFileExtension = nodepath.extname(fullFilePath);

        const separator = actualFilePath[actualFilePath.length - 1] === '/' ? '' : '/';

        const searchPath:string =
          path[0] === '/' ?
            path
            :
            `${actualFilePath}${separator}${path}`;
        fs.readdir(searchPath, (err, files) => {
          if (err) {
            return resolve([]);
          }

          let validFiles:string[] = files;
          if (filename[0] !== '.') {
            validFiles = files.filter(file => file[0] !== '.');
          }

          const results = fuzzy.filter(filename, validFiles);

          const suggestions = results.map(this.formatResult(searchPath, actualFileExtension));

          resolve(suggestions);
        });
      }
    });
  }
}

export default new Provider();
