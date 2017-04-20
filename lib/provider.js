'use babel';
import * as fs from 'fs';
import * as fuzzy from 'fuzzy';
import * as nodepath from 'path';
import * as RE from './regularExpression';
class Provider {
    constructor() {
        this.getFilePath = (fullFilePath) => fullFilePath.match(RE.withoutFilename)[0];
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
        this.formatResult = (path) => ({ string: file }) => {
            const separator = path[path.length - 1] === '/' ? '' : '/';
            const stat = fs.lstatSync(`${path}${separator}${file}`);
            const type = this.getType(stat);
            return {
                text: nodepath.basename(file, nodepath.extname(file)),
                displayText: file,
                rightLabelHTML: type,
            };
        };
        this.isQuote = (line, i) => ((line[i] === '\'' || line[i] === '\"') &&
            i - 1 >= 0 &&
            line[i - 1] !== '\\');
        this.surrounded = (line, index) => {
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
                else if (this.surrounded(line, column)) {
                    const requestPath = this.getRequestPath(line);
                    const requestString = this.getRequestString(line);
                    const filePath = this.getFilePath(fullFilePath);
                    const separator = filePath[filePath.length - 1] === '/' ? '' : '/';
                    const searchPath = requestPath[0] === '/' ?
                        requestPath
                        :
                            `${filePath}${separator}${requestPath}`;
                    fs.readdir(searchPath, (err, files) => {
                        if (err) {
                            resolve([]);
                            return console.error(err);
                        }
                        if (requestString[0] !== '.') {
                            files = files.filter(file => file[0] !== '.');
                        }
                        const results = fuzzy.filter(requestString, files);
                        const suggestions = results.map(this.formatResult(searchPath));
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
