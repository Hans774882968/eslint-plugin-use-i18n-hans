import { isNonEmptyArray } from '../src/utils/utils';

describe('utils.ts', () => {
  it('isNonEmptyArray', () => {
    expect(isNonEmptyArray('hello world')).toBeFalsy();
    expect(isNonEmptyArray([])).toBeFalsy();
    expect(isNonEmptyArray(true)).toBeFalsy();
    expect(isNonEmptyArray(false)).toBeFalsy();
    expect(isNonEmptyArray(undefined)).toBeFalsy();
    expect(isNonEmptyArray(null)).toBeFalsy();

    expect(isNonEmptyArray([123])).toBeTruthy();
    expect(isNonEmptyArray(Array(1))).toBeTruthy();
    expect(isNonEmptyArray(Array(1).fill(123))).toBeTruthy();
    expect(isNonEmptyArray(Array(2).fill(123))).toBeTruthy();
  });

  it('isNonEmptyArray ArraySubClass', () => {
    class ArraySubClass extends Array {
      customName?: string;

      setCustomName (name: string) {
        this.customName = name;
      }
    }
    const asc = new ArraySubClass(1);
    asc.setCustomName('hello world');
    expect(asc.customName).toBe('hello world');
    expect(isNonEmptyArray(asc)).toBeTruthy();
    asc.pop();
    expect(isNonEmptyArray(asc)).toBeFalsy();
  });
});
