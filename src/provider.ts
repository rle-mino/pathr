/// <reference path="../node_modules/fuzzy/lib/fuzzy.d.ts" />
'use babel';

import * as fs from 'fs';
import * as fuzzy from 'fuzzy';
import * as path from 'path';
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

  getType = (stat:fs.Stats):string => {
    if (stat.isFile()) return 'file';
    if (stat.isDirectory()) return 'directory';
    if (stat.isBlockDevice()) return 'block device';
    if (stat.isCharacterDevice()) return 'character device';
    if (stat.isSymbolicLink()) return 'symbolic link';
    if (stat.isFIFO()) return 'FIFO';
    if (stat.isSocket()) return 'socket';
  }

  isTheExtensionRemovable = (extension:string, actualFileExtension:string):boolean =>
    extension === actualFileExtension;

  formatResult = (dirname:string, actualFileExtension:string) =>
    ({ string:file }:FilterResult):AutocompleteSuggest => {
      const stat = fs.lstatSync(path.resolve(dirname, file));
      const type = this.getType(stat);
      const extension = path.extname(file);

      const text = this.isTheExtensionRemovable(extension, actualFileExtension)
        ? path.basename(file, path.extname(file))
        : file;

      return {
        text,
        displayText: file,
        rightLabelHTML: type,
      };
    }

  isQuote = (line:string, index:number):boolean => (
    (line[index] === '\'' || line[index] === '\"')
    && index - 1 >= 0
    && line[index - 1] !== '\\'
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

  getSuggestions = ({ editor, bufferPosition }) => new Promise((resolve, reject) => {
    const { row, column } = bufferPosition;
    const lines = editor.buffer.getLines();
    const line = lines[row];
    const fullFilePath = editor.buffer.file.path;

    // If it's not an import statement
    // we resolve an empty array
    // which means that we don't have anything
    // to suggest
    if (!line.match(RE.looksLikeAnImportStatement)) {
      return resolve([]);
    // If we are inside a pair of quotes
    // and inside an import statement
    // means that we should look for
    // suggestions
    } else if (this.isSurrounded(line, column)) {
      // We extract the text inside quotes
      const [textInsideQuotes] = line.match(RE.insideQuotes);
      // ... and remove the quotes
      const textWithoutQuotes = textInsideQuotes.slice(1, textInsideQuotes.length - 1);
      // then we use this text to get the dirname
      const dirname = path.dirname(textWithoutQuotes);
      // ... and the filename.
      const filename = path.basename(textWithoutQuotes);
      // We do the exact same thing for
      // the actual file since we need to
      // know where we are for relative import ('./' '../')
      const actualFileDir = path.dirname(fullFilePath);
      // ...and the file extension to know
      // if we should remove the extension.
      // If it's a .ts file, we don't want to import './foo.ts' but './foo'
      const actualFileExtension = path.extname(fullFilePath);
      // If the dirname starts with a `/`, that's an absolute import
      // else we append the actual file directory and the directory
      // the use wrote
      const searchPath:string =
        dirname[0] === '/'
          ? dirname
          : path.resolve(actualFileDir, dirname);

      fs.readdir(searchPath, (err, files) => {
        // In case there is any kind of error,
        // we resolve an empty array
        if (err || !files || files.length === 0) {
          return resolve([]);
        }

        let validFiles:string[] = files;
        // We display hidden files ONLY if the first letter of the
        // filename is a dot. If not, we remove all the hidden files
        if (filename[0] !== '.') {
          validFiles = files.filter(file => file[0] !== '.');
        }

        // We use fuzzy filter to get better results
        const results = fuzzy.filter(filename, validFiles);

        const suggestions = results.map(
          this.formatResult(searchPath, actualFileExtension),
        );

        resolve(suggestions);
      });
    }
  })
}

export default new Provider();
