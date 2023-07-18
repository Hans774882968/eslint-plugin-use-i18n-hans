import humps from 'humps';

export function hasSymbols (str: string) {
  return /[!"#%&'()*+,./:;<=>?@[\\\]^`{|}]/u.exec(str); // without " ", "$", "-" and "_"
}

export function hasUpper (str: string) {
  return /[A-Z]/u.exec(str);
}

export function isKebabCase (str: string) {
  if (
    hasUpper(str) ||
    hasSymbols(str) ||
    /^\d/u.exec(str) ||
    /^-/u.exec(str) || // starts with hyphen is not kebab-case
    /_|--|\s/u.exec(str)
  ) {
    return false;
  }
  return true;
}

export function pascalCase (str: string) {
  return humps.pascalize(str);
}
