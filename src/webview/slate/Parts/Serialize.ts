import { Descendant, Element as SlateElement } from 'slate';
import { serializeMarkdownBlock } from './Markdown';

export const serialize = (nodes: Descendant[]): string => {
    return nodes
        .map((node) => {
            if (SlateElement.isElement(node)) {
                const element = node as any;
                
                // Handle markdown blocks
                if (element.type === 'markdown_block') {
                    return serializeMarkdownBlock(element);
                }
                
                // Handle simple elements
                return serializeNode(element);
            }
            return '';
        })
        .join('\n');
};

function serializeNode(node: any): string {
    if ('text' in node) {
        return node.text;
    }

    if (SlateElement.isElement(node)) {
        const children = node.children?.map(serializeNode).join('') || '';
        
        switch (node.type) {
            case 'paragraph':
                return children;
            case 'heading':
                const level = Math.min(Math.max(node.depth || 1, 1), 6);
                return '#'.repeat(level) + ' ' + children;
            case 'list':
                return children; // List items handle their own formatting
            case 'listItem':
                const prefix = node.checked !== null ? `- [${node.checked ? 'x' : ' '}] ` : '- ';
                return prefix + children;
            case 'link':
                return `[${children}](${node.url || ''})`;
            case 'bold':
                return `**${children}**`;
            case 'italic':
                return `*${children}*`;
            case 'code':
                return node.lang ? `\`\`\`${node.lang}\n${children}\n\`\`\`` : `\`${children}\``;
            default:
                return children;
        }
    }
    
    return '';
}
