'use babel';

export const everywhere = /['"]((\.\/)|(\.\.\/)|(\/))/;

export const withoutFilename = /(.*\/)/;
export const insideQuotes = /['"]((\.\/)|(\.\.\/)|(\/)).*['"]/;
export const onlyFilename = /\/[^/]*['"]/;

export const importFrom = /from\s.*['"]((.\/)|(..\/)|(\/))/;
export const requ = /require\(['"]((\.\/)|(\.\.\/)|(\/)).*/;
export const importO = /import.*['"]((\.\/)|(\/)|(\.\.\/))/;
