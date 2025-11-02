import { Descendant } from 'slate';
import { parseMarkdown } from './Markdown';

export const deserialize = (value: string): Descendant[] => {
    if (!value || value.trim() === '') {
        return [{ type: 'paragraph', children: [{ text: '' }] } as any];
    }

    // Use the markdown parser
    try {
        return parseMarkdown(value);
    } catch (error) {
        console.error('Error parsing markdown:', error);
        // Fallback to simple paragraph
        return [{ type: 'paragraph', children: [{ text: value }] } as any];
    }
};
