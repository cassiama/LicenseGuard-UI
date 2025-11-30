/* eslint-disable no-constant-binary-expression */
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn() utility function', () => {
  describe('combining multiple class names', () => {
    it('should combine multiple string class names', () => {
      expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
    });

    it('should combine class names from an array', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should combine mixed string and array inputs', () => {
      expect(cn('class1', ['class2', 'class3'], 'class4')).toBe('class1 class2 class3 class4');
    });
  });

  describe('conditional classes', () => {
    it('should include classes when condition is true', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
    });

    it('should exclude classes when condition is false', () => {
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('should handle object syntax with boolean values', () => {
      expect(cn({
        'class1': true,
        'class2': false,
        'class3': true
      })).toBe('class1 class3');
    });

    it('should handle mixed conditional and static classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });
  });

  describe('Tailwind class merging', () => {
    it('should merge conflicting padding classes', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });

    it('should merge conflicting margin classes', () => {
      expect(cn('m-2', 'm-4')).toBe('m-4');
    });

    it('should merge conflicting background color classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('should merge conflicting text color classes', () => {
      expect(cn('text-gray-500', 'text-black')).toBe('text-black');
    });

    it('should keep non-conflicting classes', () => {
      expect(cn('p-4', 'text-red-500', 'bg-blue-500')).toBe('p-4 text-red-500 bg-blue-500');
    });

    it('should merge directional padding classes correctly', () => {
      expect(cn('px-4', 'px-2')).toBe('px-2');
      expect(cn('py-4', 'py-2')).toBe('py-2');
      expect(cn('pt-4', 'pt-2')).toBe('pt-2');
    });

    it('should handle complex Tailwind class merging', () => {
      expect(cn('px-2 py-1 bg-red-500', 'px-4 bg-blue-500')).toBe('py-1 px-4 bg-blue-500');
    });
  });

  describe('empty inputs', () => {
    it('should handle empty string', () => {
      expect(cn('')).toBe('');
    });

    it('should handle multiple empty strings', () => {
      expect(cn('', '', '')).toBe('');
    });

    it('should filter out empty strings from valid classes', () => {
      expect(cn('class1', '', 'class2')).toBe('class1 class2');
    });

    it('should handle empty array', () => {
      expect(cn([])).toBe('');
    });

    it('should handle array with empty strings', () => {
      expect(cn(['', 'class1', '', 'class2'])).toBe('class1 class2');
    });
  });

  describe('null inputs', () => {
    it('should handle null', () => {
      expect(cn(null)).toBe('');
    });

    it('should filter out null from valid classes', () => {
      expect(cn('class1', null, 'class2')).toBe('class1 class2');
    });

    it('should handle multiple null values', () => {
      expect(cn(null, null, null)).toBe('');
    });

    it('should handle null in arrays', () => {
      expect(cn(['class1', null, 'class2'])).toBe('class1 class2');
    });
  });

  describe('undefined inputs', () => {
    it('should handle undefined', () => {
      expect(cn(undefined)).toBe('');
    });

    it('should filter out undefined from valid classes', () => {
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
    });

    it('should handle multiple undefined values', () => {
      expect(cn(undefined, undefined, undefined)).toBe('');
    });

    it('should handle undefined in arrays', () => {
      expect(cn(['class1', undefined, 'class2'])).toBe('class1 class2');
    });
  });

  describe('mixed scenarios', () => {
    it('should handle mix of empty, null, and undefined', () => {
      expect(cn('class1', '', null, undefined, 'class2')).toBe('class1 class2');
    });

    it('should handle complex real-world scenario', () => {
      const isActive = true;
      const isDisabled = false;
      const customClass = 'custom';
      
      expect(cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled',
        customClass,
        null,
        undefined,
        ''
      )).toBe('base-class active custom');
    });

    it('should handle conditional with Tailwind merging', () => {
      const isPrimary = true;
      expect(cn(
        'px-4 py-2 bg-gray-500',
        isPrimary && 'bg-blue-500'
      )).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle object syntax with Tailwind merging', () => {
      expect(cn(
        'p-4 text-sm',
        {
          'p-2': true,
          'text-lg': true,
          'hidden': false
        }
      )).toBe('p-2 text-lg');
    });

    it('should handle nested arrays', () => {
      expect(cn(['class1', ['class2', 'class3']], 'class4')).toBe('class1 class2 class3 class4');
    });

    it('should handle all edge cases together', () => {
      expect(cn(
        'base',
        '',
        null,
        undefined,
        false && 'hidden',
        true && 'visible',
        ['array1', null, 'array2'],
        { 'obj1': true, 'obj2': false },
        'p-4',
        'p-2'
      )).toBe('base visible array1 array2 obj1 p-2');
    });
  });

  describe('no arguments', () => {
    it('should return empty string when called with no arguments', () => {
      expect(cn()).toBe('');
    });
  });
});
