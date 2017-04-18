'use babel';

export const withoutFilename = /(.*\/)/;
export const insideQuotes = /['"]((\.\/)|(\.\.\/)|(\/)).*['"]/;
export const onlyFilename = /\/[^/]*['"]/;
export const importFrom = /^import.*from\s.*['"]((.\/)|(..\/)|(\/))/;
export const require = /require\(['"]((\.\/)|(\.\.\/)|(\/)).*/;
