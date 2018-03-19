'use babel';
import * as fs from 'fs';
import * as fuzzy from 'fuzzy';
import * as path from 'path';
import * as RE from './regularExpression';
class Provider {
    constructor() {
        this.getType = (stat) => {
            if (stat.isFile())
                return 'file';
            if (stat.isDirectory())
                return 'directory';
            if (stat.isBlockDevice())
                return 'block device';
            if (stat.isCharacterDevice())
                return 'character device';
            if (stat.isSymbolicLink())
                return 'symbolic link';
            if (stat.isFIFO())
                return 'FIFO';
            if (stat.isSocket())
                return 'socket';
        };
        this.isTheExtensionRemovable = (extension, actualFileExtension) => extension === actualFileExtension;
        this.formatResult = (dirname, actualFileExtension) => ({ string: file }) => {
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
        };
        this.isQuote = (line, index) => ((line[index] === '\'' || line[index] === '\"')
            && index - 1 >= 0
            && line[index - 1] !== '\\');
        this.isSurrounded = (line, index) => {
            let inside = false;
            for (let i = 0; i < index; i = i + 1) {
                if (this.isQuote(line, i)) {
                    inside = !inside;
                }
            }
            return inside;
        };
        this.getSuggestions = ({ editor, bufferPosition }) => new Promise((resolve, reject) => {
            const { row, column } = bufferPosition;
            const lines = editor.buffer.getLines();
            const line = lines[row];
            const fullFilePath = editor.buffer.file.path;
            if (!line.match(RE.looksLikeAnImportStatement)) {
                return resolve([]);
            }
            else if (this.isSurrounded(line, column)) {
                const [textInsideQuotes] = line.match(RE.insideQuotes);
                const textWithoutQuotes = textInsideQuotes.slice(1, textInsideQuotes.length - 1);
                const dirname = path.dirname(textWithoutQuotes);
                const filename = path.basename(textWithoutQuotes);
                const actualFileDir = path.dirname(fullFilePath);
                const actualFileExtension = path.extname(fullFilePath);
                const searchPath = dirname[0] === '/'
                    ? dirname
                    : path.resolve(actualFileDir, dirname);
                fs.readdir(searchPath, (err, files) => {
                    if (err || !files || files.length === 0) {
                        return resolve([]);
                    }
                    let validFiles = files;
                    if (filename[0] !== '.') {
                        validFiles = files.filter(file => file[0] !== '.');
                    }
                    const results = fuzzy.filter(filename, validFiles);
                    const suggestions = results.map(this.formatResult(searchPath, actualFileExtension));
                    resolve(suggestions);
                });
            }
        });
        this.selector = '*';
        this.inclusionPriority = 1;
        this.suggestionPriority = 2;
        this.excludeLowerPriority = false;
    }
}
export default new Provider();
