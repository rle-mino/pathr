'use babel';

export const looksLikeAnImportStatement = /['"]((\.\/)|(\.\.\/)|(\/))/;
export const insideQuotes = /['"]((\.\/)|(\.\.\/)|(\/)).*['"]/;
