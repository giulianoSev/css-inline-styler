import postcss, { AtRule, Declaration, Rule } from 'postcss';

export interface ConfigOptions {
  useTabs?: boolean;
  tabSize?: number;
  indentSize?: number;
  keepEmptyLines?: boolean;
  maxPrintWidth?: number;
  sortDeclarations?: 'alpha' | 'alpha-inverted';
}

const DEFAULT_TAB_SIZE = 1 as const;
const DEFAULT_INDENT_SIZE = 2 as const;

const defaultConfigOptions: Readonly<ConfigOptions> = {
  useTabs: false,
  tabSize: DEFAULT_TAB_SIZE,
  indentSize: DEFAULT_INDENT_SIZE,
  keepEmptyLines: false,
  maxPrintWidth: undefined,
} as const;

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

const getOcurrencesCount = (str: string, substr: string) => {
  let count = 0;
  let startIndex = 0;

  while ((startIndex = str.indexOf(substr, startIndex)) !== -1) {
    count++;
    startIndex += substr.length;
  }

  return count;
};

const getIndentation = (config: ConfigOptions) => {
  return config.useTabs
    ? '\t'.repeat(config.tabSize ?? DEFAULT_TAB_SIZE)
    : ' '.repeat(config.indentSize ?? DEFAULT_INDENT_SIZE);
};

const setRuleRaws = (node: Rule, config: ConfigOptions = defaultConfigOptions) => {
  const indent = config.maxPrintWidth && node.parent && node.parent?.toString().length > config.maxPrintWidth;

  node.selector = prettify(node.selector);
  node.raws.between = ' ';
  node.raws.after = indent ? '\r\n' : ' ';
  node.raws.semicolon = true;

  if (node.parent?.type === 'atrule') {
    const indentation = getIndentation(config);
    node.raws.before =
      getOcurrencesCount(node.raws.before ?? '', '\r\n') > 1 ? `\r\n\r\n${indentation}` : `\r\n${indentation}`;
  }

  if (config.sortDeclarations) {
    node.nodes = node.nodes.sort((a, b) => {
      if (config.sortDeclarations === 'alpha') {
        return a.toString().localeCompare(b.toString());
      }

      return b.toString().localeCompare(a.toString());
    });
  }
};

const setAtruleRaws = (node: AtRule) => {
  node.params = prettify(node.params);
  node.raws.between = node.nodes?.length ? ' ' : '';
  node.raws.afterName = ' ';
  node.raws.after = '\r\n';
};

const setDeclarationRaws = (node: Declaration, config = defaultConfigOptions) => {
  const indent = config.maxPrintWidth && node.parent && node.parent?.toString().length > config.maxPrintWidth;
  const indentation = getIndentation(config);

  node.value = prettify(node.value);
  node.raws.important = node.raws.important && ' ' + prettify(node.raws.important);
  node.raws.before = indent ? `\r\n${indentation}` : ' ';
  node.raws.after = indent ? '\r\n' : '';
  node.raws.between = ': ';
};

const getWithoutRedundantNewLines = (str: string, config: ConfigOptions = defaultConfigOptions) => {
  if (config.keepEmptyLines) {
    return str;
  }

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

export const getStyledCss = (css: string, config: ConfigOptions = defaultConfigOptions) => {
  const root = postcss.parse(getWithoutRedundantNewLines(css));

  root.walk((node) => {
    switch (node.type) {
      case 'rule':
        setRuleRaws(node, config);
        break;
      case 'atrule':
        setAtruleRaws(node);
        break;
      case 'decl':
        setDeclarationRaws(node, config);
        break;
    }
  });

  return root.toString();
};
