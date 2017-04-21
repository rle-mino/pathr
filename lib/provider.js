'use babel';
import * as fs from 'fs';
import * as fuzzy from 'fuzzy';
import * as nodepath from 'path';
import * as RE from './regularExpression';
class Provider {
    constructor() {
        this.getActualFilePath = (fullFilePath) => fullFilePath.match(RE.withoutFilename)[0];
        this.getActualFilename = (fullFilePath) => fullFilePath.match(RE.onlyFilename)[0];
        this.getRequestPath = (line) => {
            const [path] = line.match(RE.insideQuotes);
            const withoutQuotes = path.slice(1, path.length - 1);
            return withoutQuotes.match(RE.withoutFilename)[0];
        };
        this.getRequestString = (line) => {
            const request = line.match(RE.onlyFilename)[0];
            return request.slice(1, request.length - 1);
        };
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
        this.removeExtension = (extension, actualFileExtension) => extension === actualFileExtension;
        this.formatResult = (path, actualFileExtension) => ({ string: file }) => {
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
        };
        this.isQuote = (line, i) => ((line[i] === '\'' || line[i] === '\"') &&
            i - 1 >= 0 &&
            line[i - 1] !== '\\');
        this.isSurrounded = (line, index) => {
            let inside = false;
            for (let i = 0; i < index; i = i + 1) {
                if (this.isQuote(line, i)) {
                    inside = !inside;
                }
            }
            return inside;
        };
        this.getSuggestions = ({ editor, bufferPosition: { row, column }, prefix }) => {
            return new Promise((resolve, reject) => {
                const { lines, file: { path: fullFilePath }, } = editor.getBuffer();
                const line = lines[row];
                if (!line.match(RE.importFrom) &&
                    !line.match(RE.requ)) {
                    resolve([]);
                }
                else if (this.isSurrounded(line, column)) {
                    const path = this.getRequestPath(line);
                    const filename = this.getRequestString(line);
                    const actualFilePath = this.getActualFilePath(fullFilePath);
                    const actualFileExtension = nodepath.extname(fullFilePath);
                    const separator = actualFilePath[actualFilePath.length - 1] === '/' ? '' : '/';
                    const searchPath = path[0] === '/' ?
                        path
                        :
                            `${actualFilePath}${separator}${path}`;
                    fs.readdir(searchPath, (err, files) => {
                        if (err) {
                            resolve([]);
                            return console.error(err);
                        }
                        let validFiles = files;
                        if (filename[0] !== '.') {
                            validFiles = files.filter(file => file[0] !== '.');
                        }
                        const results = fuzzy.filter(filename, files);
                        const suggestions = results.map(this.formatResult(searchPath, actualFileExtension));
                        resolve(suggestions);
                    });
                }
            });
        };
        this.selector = '.source.js, .source.jsx, .source.ts, .source.tsx';
        this.inclusionPriority = 1;
        this.suggestionPriority = 2;
        this.excludeLowerPriority = false;
    }
}
export default new Provider();
