export const RE_REGEXP_STR = /^\/(.+)\/(.*)$/;

export function toRegExp (str: string) {
  const parts = RE_REGEXP_STR.exec(str);
  if (parts) {
    return new RegExp(parts[1], parts[2]);
  }
  return new RegExp(`^${escape(str)}$`);
}
