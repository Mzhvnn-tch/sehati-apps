import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
    describe('cn', () => {
        it('merges class names correctly', () => {
            expect(cn('w-full', 'h-full')).toBe('w-full h-full');
        });

        it('handles conditional classes', () => {
            expect(cn('w-full', false && 'h-full', 'p-4')).toBe('w-full p-4');
        });

        it('resolves tailwind conflicts', () => {
            // p-4 should overwrite p-2
            expect(cn('p-2', 'p-4')).toBe('p-4');
        });
    });
});
