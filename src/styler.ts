import { readFileSync, writeFileSync } from 'fs';
import postcss, { AtRule, Declaration, Rule } from 'postcss';

const prettify = (str: string) => {
  return str
    .trim()
    .replace(/[\r\s]/g, ' ')
    .replace(/\+/g, ' + ')
    .replace(/\s\s+/g, ' ')
    .replace(/\[\s/g, '[')
    .replace(/\s\]/g, ']')
    .replace(/\(\s/g, '(')
    .replace(/\s\)/g, ')')
    .replace(/\s:/g, ':');
};

const getOcurrences = (str: string, substr: string) => {
  let count = 0;
  let startIndex = 0;

  while ((startIndex = str.indexOf(substr, startIndex)) !== -1) {
    count++;
    startIndex += substr.length;
  }

  return count;
};

const setRuleRaws = (node: Rule) => {
  node.selector = prettify(node.selector);
  node.raws.between = ' ';
  node.raws.after = ' ';
  node.raws.semicolon = true;

  if (node.parent?.type === 'atrule') {
    node.raws.before = getOcurrences(node.raws.before ?? '', '\r\n') > 1 ? '\r\n\r\n  ' : '\r\n  ';
  }
};

const setAtruleRaws = (node: AtRule) => {
  node.params = prettify(node.params);
  node.raws.between = node.nodes?.length ? ' ' : '';
  node.raws.afterName = ' ';
  node.raws.after = '\r\n';
};

const setDeclarationRaws = (node: Declaration) => {
  node.value = prettify(node.value);
  node.raws.important = node.raws.important && ' ' + prettify(node.raws.important);
  node.raws.before = ' ';
  node.raws.after = '';
  node.raws.between = ': ';
};

const getWithoutRedundantNewLines = (str: string) => {
  const tokens = str.split('\r\n').map((str) => str.trim());

  let result: string[] = [];

  let inComment = false;

  for (const token of tokens) {
    if (token.startsWith('/*')) {
      inComment = true;
    }

    if (token.endsWith('*/')) {
      inComment = false;
    }

    if (!inComment && token === '' && result.at(-1) === '') {
      continue;
    }

    result.push(token);
  }

  return result.join('\r\n');
};

export const getResult = (css: string) => {
  const root = postcss.parse(getWithoutRedundantNewLines(css));

  root.walk((node) => {
    switch (node.type) {
      case 'rule':
        setRuleRaws(node);
        break;
      case 'atrule':
        setAtruleRaws(node);
        break;
      case 'decl':
        setDeclarationRaws(node);
        break;
    }
  });

  return root.toString();
};
