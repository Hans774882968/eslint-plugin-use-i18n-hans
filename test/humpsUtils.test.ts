import { isKebabCase, pascalCase } from '../src/utils/humpsUtils';

describe('humpsUtils.ts', () => {
  it('pascalCase', () => {
    expect(pascalCase('custom-component')).toBe('CustomComponent');
    expect(pascalCase('div')).toBe('Div');
  });

  it('isKebabCase', () => {
    expect(isKebabCase('custom-component')).toBeTruthy();
    expect(isKebabCase('component')).toBeTruthy();
    expect(isKebabCase('0custom-component')).toBeFalsy();
    expect(isKebabCase('custom_component')).toBeFalsy();
    expect(isKebabCase('Custom-Component')).toBeFalsy();
    expect(isKebabCase('Custom_Component')).toBeFalsy();
  });
});
