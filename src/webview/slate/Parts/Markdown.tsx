import React from 'react';
import remarkParse from 'remark-parse';
import { remarkToSlate } from 'remark-slate-transformer';
import { BaseEditor, Descendant, Editor, NodeEntry, Range, Element as SlateElement, Text as SlateText } from 'slate';
import { ReactEditor, RenderElementProps } from 'slate-react';
import { unified } from 'unified';
import { generateChangeId, TrackedChangeElement } from './TrackedChanges';

export type MarkdownElement = {
    type: 'markdown_block';
    id: string;
    level?: number;
    parentId?: string;
    format?: any;
    nodeFormat?: boolean;
    show?: any;
    markdownFile: string;
    children: Descendant[];
};
export type HeadingElement = {
    type: 'heading';
    depth: number;
    children: Descendant[];
};
export type ListElement = {
    type: 'list';
    ordered: boolean;
    start?: number | null;
    spread?: boolean;
    children: Descendant[];
}

export type ListItemElement = {
    type: 'listItem';
    checked: boolean | null;
    spread?: boolean;
    children: Descendant[];
}
export type CustomText = {
    text: string;
    strong?: boolean;     // for **bold**
    emphasis?: boolean;   // for *italic*
    code?: boolean;       // if you ever support `inline code`
    highlighted?: boolean; // for text marking
    'read-only'?: boolean; // for text marking
    comment?: string;     // for comments
    isInstructionToAI?: boolean; // for AI instruction flag on comments
    underline?: boolean;  // for underline
    strikethrough?: boolean; // for strikethrough
};
export type CodeElement = {
    type: 'code';
    lang?: string;
    children: Descendant[]; // usually one Text node
};

/** Return true if this element is a listItem */
export const isListItem = (n: any): n is ListItemElement => SlateElement.isElement(n) && n.type === 'listItem';

/** Return true if this element is a list */
export const isList = (n: any): n is ListElement => SlateElement.isElement(n) && n.type === 'list';


/**
 * Add a new block type to the editor.
 */
export const withMarkdown = (editor: Editor) => {
    const { isBlock } = editor;
    editor.isBlock = el => {
        return el.type === 'markdown_block' ? true : isBlock(el);
    };
    return editor;
};


/** Recursively ensure every element has at least one text child */
function fillEmptyChildren(nodes: Descendant[]): Descendant[] {
    return nodes.map(node => {
        if (SlateElement.isElement(node)) {
            const children = node.children && node.children.length > 0
                ? fillEmptyChildren(node.children)
                : [{ text: '' }];               // <— inject an empty text node

            return { ...node, children };
        } else {
            return node; // text node
        }
    });
}

/**
 * Recursively walk a Slate tree and, for any listItem
 * whose only child is a paragraph, replace that child
 * with the paragraph’s own children.
 */
function flattenListItemParagraphs(nodes: Descendant[]): Descendant[] {
    return nodes.map(node => {
        if (SlateElement.isElement(node)) {
            // First process its children
            const children = flattenListItemParagraphs(node.children);

            // Then, if this is a listItem with exactly one paragraph child,
            // pull that paragraph’s text nodes up one level:
            if (node.type === 'listItem'
                && children.length === 1
                && SlateElement.isElement(children[0])
                && children[0].type === 'paragraph') {
                return {
                    ...node,
                    children: (children[0] as SlateElement).children
                };
            }

            // Otherwise just return the element with its (possibly transformed) children
            return { ...node, children };
        }

        // Text node: return as‐is
        return node;
    });
}

/**
 * Parse HTML-like text marks from markdown string
 */
function parseTextMarks(markdown: string): Descendant[] {
    // Regex to match our custom text marks with comment and ai-instructions attributes
    const markRegex = /<mark type="(highlighted|read-only|comment)"(?:\s+comment="([^"]*?)")?(?:\s+ai-instructions="([^"]*?)")?>(.*?)<\/mark>/gs;
    
    console.log('Parsing text marks with regex:', markRegex.source);
    
    // Split by double newlines first to preserve paragraph breaks
    const paragraphBlocks = markdown.split(/\n\s*\n/);
    const result: Descendant[] = [];
    
    for (const block of paragraphBlocks) {
        if (!block.trim()) {
            // Empty block - add empty paragraph to preserve spacing
            result.push({
                type: 'paragraph',
                children: [{ text: '' }]
            });
            continue;
        }
        
        const lines = block.trim().split('\n');
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i];
            
            // Check for code blocks first (```code```)
            if (line.trim().startsWith('```')) {
                const lang = line.trim().slice(3);
                const codeLines: string[] = [];
                i++; // move to next line after opening ```
                
                // Collect all lines until closing ```
                while (i < lines.length && !lines[i].trim().startsWith('```')) {
                    codeLines.push(lines[i]);
                    i++;
                }
                
                result.push({
                    type: 'code',
                    lang: lang || undefined,
                    children: [{ text: codeLines.join('\n') }]
                });
                
                i++; // skip the closing ```
                continue;
            }
            
            // Check if this line is a header (starts with #)
            const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const headerText = headerMatch[2];
                console.log(`Found header level ${level} in text marks:`, headerText);
                
                result.push({
                    type: 'heading',
                    depth: level,
                    children: processLineWithMarks(headerText)
                });
                
                i++;
                continue;
            }
            
            // Check for list items (- item or 1. item)
            const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
            if (listMatch) {
                const indent = listMatch[1].length;
                const marker = listMatch[2];
                const itemText = listMatch[3];
                const isOrdered = /\d+\./.test(marker);
                
                // For now, treat each list item as a separate list (simplified approach)
                // A more complete implementation would group consecutive list items
                result.push({
                    type: 'list',
                    ordered: isOrdered,
                    children: [{
                        type: 'listItem',
                        checked: null,
                        children: processLineWithMarks(itemText)
                    }]
                });
                
                i++;
                continue;
            }
            
            // Default: treat as paragraph
            if (line.trim().length > 0) {
                result.push({
                    type: 'paragraph',
                    children: processLineWithMarks(line)
                });
            } else {
                // Empty line - add empty paragraph to preserve spacing
                result.push({
                    type: 'paragraph',
                    children: [{ text: '' }]
                });
            }
            
            i++;
        }
    }
    
    return result;
    
    // Helper function to process a line of text for marks and formatting
    function processLineWithMarks(text: string): Descendant[] {
        const children: Descendant[] = [];
        let lastIndex = 0;
        
        // Reset regex for this line with ai-instructions support
        const lineMarkRegex = /<mark type="(highlighted|read-only|comment)"(?:\s+comment="([^"]*?)")?(?:\s+ai-instructions="([^"]*?)")?>(.*?)<\/mark>/gs;
        let match: RegExpExecArray | null;
        
        while ((match = lineMarkRegex.exec(text)) !== null) {
            // Add plain text before the mark
            if (match.index > lastIndex) {
                const beforeText = text.slice(lastIndex, match.index);
                processAndAddFormattedText(beforeText, children);
            }
            
            // Add the marked text
            const markType = match[1] as 'highlighted' | 'read-only' | 'comment';
            const comment = match[2] || '';
            const aiInstructions = match[3] || '';
            const markedText = match[4];
            
            const textNode: CustomText = { text: markedText };
            
            // Process markdown formatting inside the mark
            if (markedText.match(/\*\*(.*?)\*\*/)) {
                textNode.strong = true;
                textNode.text = textNode.text.replace(/\*\*(.*?)\*\*/g, '$1');
            }
            if (markedText.match(/\*(.*?)\*/)) {
                textNode.emphasis = true;
                textNode.text = textNode.text.replace(/\*(.*?)\*/g, '$1');
            }
            if (markedText.match(/`(.*?)`/)) {
                textNode.code = true;
                textNode.text = textNode.text.replace(/`(.*?)`/g, '$1');
            }
            
            // Add the mark type
            if (markType === 'highlighted') {
                textNode.highlighted = true;
            } else if (markType === 'read-only') {
                textNode['read-only'] = true;
            } else if (markType === 'comment') {
                const unescapedComment = comment.replace(/&quot;/g, '"')
                                                .replace(/&amp;/g, '&')
                                                .replace(/&lt;/g, '<')
                                                .replace(/&gt;/g, '>')
                                                .replace(/&apos;/g, "'");
                textNode.comment = unescapedComment;
                
                // Set AI instruction flag if present
                if (aiInstructions === 'yes') {
                    textNode.isInstructionToAI = true;
                }
            }
            
            children.push(textNode);
            lastIndex = match.index + match[0].length;
        }
        
        // Add any remaining text
        if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            processAndAddFormattedText(remainingText, children);
        }
        
        // If no children were created, add the entire text
        if (children.length === 0) {
            processAndAddFormattedText(text, children);
        }
        
        return children;
    }
}

/**
 * Helper function to process markdown formatting in plain text
 */
function processAndAddFormattedText(text: string, children: Descendant[]): void {
    // Process bold text
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastBoldIndex = 0;
    let boldMatch: RegExpExecArray | null;
    
    // Check if we have any bold formatting
    if (text.includes('**')) {
        console.log('Processing bold formatting in:', text);
        
        while ((boldMatch = boldRegex.exec(text)) !== null) {
            // Add text before the bold match
            if (boldMatch.index > lastBoldIndex) {
                const beforeText = text.slice(lastBoldIndex, boldMatch.index);
                if (beforeText.trim()) {
                    children.push({ text: beforeText });
                }
            }
            
            // Add the bold text
            const boldText = boldMatch[1];
            if (boldText.trim()) {
                children.push({ text: boldText, strong: true });
                console.log('Added bold text node:', boldText);
            }
            
            lastBoldIndex = boldMatch.index + boldMatch[0].length;
        }
        
        // Add any remaining text after the last bold match
        if (lastBoldIndex < text.length) {
            const remainingText = text.slice(lastBoldIndex);
            if (remainingText.trim()) {
                children.push({ text: remainingText });
            }
        }
    } else {
        // No bold formatting, just add the text
        if (text.trim()) {
            children.push({ text });
        }
    }
}

/**
 * Extract marked text from markdown string
 */
export function getMarkedText(markdown: string, type?: 'highlighted' | 'read-only' | 'comment'): Array<{text: string, type: 'highlighted' | 'read-only' | 'comment', comment?: string, isInstructionToAI?: boolean}> {
    const markRegex = /<mark type="(highlighted|read-only|comment)"(?:\s+comment="([^"]*?)")?(?:\s+ai-instructions="([^"]*?)")?>(.*?)<\/mark>/g;
    const results: Array<{text: string, type: 'highlighted' | 'read-only' | 'comment', comment?: string, isInstructionToAI?: boolean}> = [];
    let match: RegExpExecArray | null;
    
    while ((match = markRegex.exec(markdown)) !== null) {
        const markType = match[1] as 'highlighted' | 'read-only' | 'comment';
        const comment = match[2] || '';
        const aiInstructions = match[3] || '';
        const markedText = match[4];
        
        // Process any markdown formatting inside the marked text
        // We're returning the marked text as-is, including any markdown syntax
        
        if (!type || markType === type) {
            results.push({ 
                text: markedText,  // Keep the original text with markdown formatting
                type: markType, 
                ...(comment && { comment }),
                ...(aiInstructions === 'yes' && { isInstructionToAI: true })
            });
        }
    }
    
    return results;
}

/**
 * Parse markdown string with tracked changes into Slate value
 */
function parseTrackedChanges(markdown: string): Descendant[] {
    console.log('🔍 PARSE TRACKED CHANGES DEBUG:', {
        inputLength: markdown.length,
        inputPreview: markdown.substring(0, 200),
        hasChangePattern: /\[change type="(create|update|delete)"\]/.test(markdown),
        hasChangePatternWithQuotes: /\[change\s+type=["']?(create|update|delete)["']?\]/.test(markdown),
        firstChangeIndex: markdown.indexOf('[change'),
        firstChangeSlice: markdown.slice(markdown.indexOf('[change'), markdown.indexOf('[change') + 50)
    });

    const results: Descendant[] = [];
    let currentIndex = 0;
    
    // Updated regex to handle optional id attribute
    const trackedChangeRegex = /\[change\s+type=["']?(create|update|delete)["']?(?:\s+id=["']?([^"'\]]+)["']?)?\](.*?)\[\/change\]/gs;
    let match: RegExpExecArray | null;
    let matchCount = 0;
    
    console.log('🔍 REGEX TESTING:', {
        regexPattern: trackedChangeRegex.source,
        testInput: markdown.substring(0, 100),
        firstTest: trackedChangeRegex.test(markdown.substring(0, 100))
    });
    
    // Reset regex lastIndex after test
    trackedChangeRegex.lastIndex = 0;
    
    while ((match = trackedChangeRegex.exec(markdown)) !== null) {
        matchCount++;
        const [fullMatch, changeType, existingId, content] = match;
        const matchStart = match.index;
        
        console.log(`🎯 FOUND TRACKED CHANGE #${matchCount}:`, {
            changeType,
            existingId,
            content: content.substring(0, 100),
            fullMatchLength: fullMatch.length,
            matchStart,
            currentIndex
        });
        
        // Add any text before this tracked change as regular content
        if (matchStart > currentIndex) {
            const beforeText = markdown.slice(currentIndex, matchStart);
            if (beforeText.trim()) {
                console.log('📝 Adding regular content before tracked change:', beforeText.substring(0, 50));
                // Parse the regular markdown content
                const beforeNodes = parseMarkdownContent(beforeText);
                results.push(...beforeNodes);
            }
        }
        
        // Generate ID if not provided
        const changeId = existingId || generateChangeId();
        
        // Map changeType to TrackedChange types
        const mappedChangeType = changeType === 'delete' ? 'deletion' : 'insertion';
        
        // Create the tracked change element with parsed markdown content
        const trackedChangeElement: TrackedChangeElement = {
            type: 'tracked-change' as const,
            changeType: mappedChangeType,
            changeId,
            children: parseMarkdownContent(content)
        };
        
        console.log('✅ Created tracked change element:', trackedChangeElement);
        results.push(trackedChangeElement);
        
        currentIndex = matchStart + fullMatch.length;
    }
    
    console.log(`📊 PARSE RESULTS: Found ${matchCount} tracked changes, created ${results.length} elements`);
    
    // Add any remaining text after the last tracked change
    if (currentIndex < markdown.length) {
        const remainingText = markdown.slice(currentIndex);
        if (remainingText.trim()) {
            console.log('📝 Adding remaining content after tracked changes:', remainingText.substring(0, 50));
            const remainingNodes = parseMarkdownContent(remainingText);
            results.push(...remainingNodes);
        }
    }
    
    // If no tracked changes were found, parse as regular markdown
    if (results.length === 0) {
        console.log('❌ No tracked changes found, parsing as regular markdown');
        return parseMarkdownContent(markdown);
    }
    
    // Ensure we have at least one element
    if (results.length === 0) {
        console.log('⚠️ No results, returning empty paragraph');
        return [{ type: 'paragraph', children: [{ text: '' }] }];
    }
    
    console.log('✅ Final results:', results.length, 'elements');
    return results;
}

/**
 * Helper function to parse regular markdown content
 */
function parseMarkdownContent(markdown: string): Descendant[] {
    if (!markdown.trim()) {
        return [];
    }
    
    // Use the original unified/remark parsing for regular markdown
    const parser = unified().use(remarkParse);
    const mdast = parser.parse(markdown);
    
    const processor = unified()
        .use(remarkParse)
        .use(remarkToSlate);
    
    const slateValue = processor.processSync(markdown).result as Descendant[];
    return fillEmptyChildren(slateValue);
}

/**
 * Parse a markdown string into a Slate value.
 */
export function parseMarkdown(markdown: string): Descendant[] {
    // Debug: Parse markdown content
    
    // First, check if the markdown contains our custom text marks or tracked changes
    const hasHighlightedMarks = /<mark type="highlighted">(.*?)<\/mark>/g.test(markdown);
    const hasReadOnlyMarks = /<mark type="read-only">(.*?)<\/mark>/g.test(markdown);
    const hasCommentMarks = /<mark type="comment"(.*?)>(.*?)<\/mark>/g.test(markdown);
    const hasTrackedChanges = /\[change\s+type=["']?(create|update|delete)["']?(?:\s+id=["']?[^"'\]]+["']?)?\]/.test(markdown);
    
    // Mark detection analysis
    
    if (hasHighlightedMarks || hasReadOnlyMarks || hasCommentMarks || hasTrackedChanges) {
        // Use our custom parser for text marks and tracked changes
        if (hasTrackedChanges) {
            // Using tracked changes parser
            return parseTrackedChanges(markdown);
        } else {
            console.log('� Using parseTextMarks');
            return parseTextMarks(markdown);
        }
    }
    
    // Use the original parsing for regular markdown
    // Using regular markdown parsing
    // 1) Set up a parser-only processor
    const parser = unified().use(remarkParse);

    // 2) *Directly* parse the string → mdast
    const mdast = parser.parse(markdown);
    // console.log('🧪 [parseMarkdown] MDAST:', JSON.stringify(mdast, null, 2));

    // 3) Now re-build the full pipeline (parse → plugins → slate)
    const processor = unified()
        .use(remarkParse)    // parse again…
        .use(remarkToSlate); // …then transform to Slate

    // 4) Turn it into your Slate value
    const slateValue = processor.processSync(markdown).result as Descendant[];
    // console.log('💠 [parseMarkdown] Slate Value:', JSON.stringify(slateValue, null, 2));

    // The remarkToSlate transformer should already handle standard markdown formatting
    // If we're getting here, it means the transformer worked and we should already have
    // proper Slate elements with formatting applied. Let's just verify the structure
    // and add any missing processing that the transformer might have missed.
    const processFormattedText = (nodes: Descendant[]): Descendant[] => {
        return nodes.map(node => {
            if (SlateElement.isElement(node)) {
                // Recursively process children
                return {
                    ...node,
                    children: processFormattedText(node.children)
                };
            } else if (SlateText.isText(node)) {
                // Check if the remarkToSlate transformer missed any formatting
                // This should be rare since remarkToSlate should handle standard markdown
                let textNode = { ...node };
                const text = textNode.text;
                
                // Only process if we still have markdown syntax in the text
                // (which would indicate the transformer didn't handle it properly)
                if (text.includes('**') || text.includes('*') || text.includes('`')) {
                    console.log('Found unprocessed markdown syntax in text node:', text);
                    
                    // Process bold text (**text**)
                    if (text.includes('**')) {
                        const boldPattern = /\*\*(.*?)\*\*/g;
                        const matches = Array.from(text.matchAll(boldPattern));
                        
                        if (matches.length > 0) {
                            console.log('Processing unhandled bold pattern:', text, matches);
                            textNode.strong = true;
                            textNode.text = text.replace(boldPattern, '$1');
                        }
                    }
                    
                    // Process italic text (*text*) - but avoid conflicts with bold
                    if (text.includes('*') && !text.includes('**')) {
                        const italicPattern = /\*(.*?)\*/g;
                        const matches = Array.from(text.matchAll(italicPattern));
                        
                        if (matches.length > 0) {
                            console.log('Processing unhandled italic pattern:', text, matches);
                            textNode.emphasis = true;
                            textNode.text = text.replace(italicPattern, '$1');
                        }
                    }
                    
                    // Process inline code (`text`)
                    if (text.includes('`')) {
                        const codePattern = /`(.*?)`/g;
                        const matches = Array.from(text.matchAll(codePattern));
                        
                        if (matches.length > 0) {
                            console.log('Processing unhandled code pattern:', text, matches);
                            textNode.code = true;
                            textNode.text = text.replace(codePattern, '$1');
                        }
                    }
                }
                
                return textNode;
            }
            return node;
        });
    };

    // Process the slate value to handle markdown formatting
    let processedValue = processFormattedText(slateValue);
    
    // fill in any missing text leaves
    let safeValue = fillEmptyChildren(processedValue);
    safeValue = flattenListItemParagraphs(safeValue);
    
    // Ensure that paragraphs are properly separated - the remarkToSlate transformer
    // should already handle this correctly for standard markdown parsing
    // Parse markdown complete

    return safeValue;
}

/**
 * Custom serialization to handle text marks
 */
function serializeTextNode(node: CustomText): string {
    let text = node.text;
    
    // Apply markdown formatting FIRST
    // This ensures markdown syntax like **bold** is preserved inside mark tags
    if (node.strong) {
        text = `**${text}**`;
        console.log('Serializing strong text:', text);
    }
    if (node.emphasis) {
        text = `*${text}*`;
        console.log('Serializing emphasized text:', text);
    }
    if (node.code) {
        text = `\`${text}\``;
    }
    
    // Then handle text marks with HTML-like tags
    if (node.highlighted) {
        text = `<mark type="highlighted">${text}</mark>`;
    } else if (node['read-only']) {
        text = `<mark type="read-only">${text}</mark>`;
    } else if (node.comment) {
        // Escape special characters in comments to prevent XML/HTML parsing issues
        const escapedComment = (node.comment || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
        
        // Check if this comment is marked as an AI instruction
        const aiInstructionsAttr = node.isInstructionToAI ? ' ai-instructions="yes"' : '';
        
        // Wrap the text in a mark tag with the comment attribute and optionally ai-instructions
        text = `<mark type="comment" comment="${escapedComment}"${aiInstructionsAttr}>${text}</mark>`;
    }
    
    return text;
}

/**
 * Serialize the children of a markdown_block back into a Markdown string.
 */
export function serializeMarkdownBlock(children: Descendant[]): string {
    // Custom serialization to handle text marks
    const serializeNodes = (nodes: Descendant[]): string => {
        const results: string[] = [];
        
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            
            if (SlateElement.isElement(node)) {
                // Handle different element types
                switch (node.type) {
                    case 'paragraph':
                        const paragraphText = serializeNodes(node.children);
                        // Only add non-empty paragraphs to preserve proper spacing
                        if (paragraphText.trim().length > 0) {
                            results.push(paragraphText);
                        } else {
                            // Add empty paragraph to preserve line breaks
                            results.push('');
                        }
                        break;
                    case 'heading':
                        const level = (node as HeadingElement).depth;
                        const headingText = serializeNodes(node.children);
                        results.push('#'.repeat(level) + ' ' + headingText);
                        break;
                    case 'list':
                        const listItems = node.children.map((item, index) => {
                            if (SlateElement.isElement(item)) {
                                const itemText = serializeNodes(item.children);
                                return (node as ListElement).ordered ? `${index + 1}. ${itemText}` : `- ${itemText}`;
                            }
                            return '';
                        }).join('\n');
                        results.push(listItems);
                        break;
                    case 'listItem':
                        results.push(serializeNodes(node.children));
                        break;
                    case 'code':
                        const codeText = serializeNodes(node.children);
                        const lang = (node as CodeElement).lang || '';
                        results.push(`\`\`\`${lang}\n${codeText}\n\`\`\``);
                        break;
                    case 'tracked-change':
                        const trackedNode = node as any; // TrackedChangeElement type
                        const trackedContent = serializeNodes(trackedNode.children);
                        results.push(`[change type="${trackedNode.changeType}"]${trackedContent}[/change]`);
                        break;
                    default:
                        results.push(serializeNodes(node.children));
                        break;
                }
            } else {
                // Text node - serialize with our custom function
                results.push(serializeTextNode(node as CustomText));
            }
        }
        
        // Join paragraph elements with double newlines to create proper markdown paragraphs
        // This ensures that when the user presses Enter in the editor, it creates actual paragraph breaks
        return results.join('\n\n');
    };
    
    const serialized = serializeNodes(children);
    return serialized;
}


/**
 * Convert a Slate value to a markdown string.
 */
export function MarkdownBlockElement(props: RenderElementProps) {

    const element = props.element as MarkdownElement;
    const { attributes, children } = props;

    return (
        <div
            {...attributes}
            className={`markdown level-${element.level ?? 0}`}
            data-node-id={element.id}
            data-level={(element.level ?? 0) + 1}
        >
            {/*<div contentEditable={false} className="block-label"><SmallTag>Markdown</SmallTag></div>*/}
            {children}
        </div>
    );
}



/**
 * Purely compute the split; does _not_ modify the editor.
 */
export function splitFileAtCursorPosition(editor: BaseEditor & ReactEditor): {
    currentBlockId: string
    currentBlockMarkdown: string
    newBlockMarkdown: string
} | null {
    const { selection } = editor
    if (!selection || !Range.isCollapsed(selection)) {
        return null
    }

    // 1) Find the enclosing markdown_block
    const above = Editor.above(editor as any, {
        at: selection,
        match: n =>
            SlateElement.isElement(n) && (n as SlateElement).type === 'markdown_block',
    }) as NodeEntry<MarkdownElement> | undefined

    if (!above) return null
    const [blockNode, blockPath] = above

    // 2) Compute the relative path & offset inside that block
    const { anchor } = selection
    const relPath = anchor.path.slice(blockPath.length)  // e.g. [ i0, i1, …, leafIndex ]
    const offset = anchor.offset                     // where in the leaf text

    // 3) Recursively split one SlateElement into two at [relPath, offset]
    function splitNodeAt(
        el: SlateElement,
        path: number[],
        off: number
    ): [SlateElement, SlateElement] {
        const idx = path[0]
        const beforeSibs = el.children.slice(0, idx)
        const afterSibs = el.children.slice(idx + 1)
        const target = el.children[idx]

        let childBefore: SlateElement | SlateText
        let childAfter: SlateElement | SlateText

        if (path.length === 1) {
            // we’re at the text‐leaf to split
            if (!SlateText.isText(target)) {
                throw new Error('Cursor isn’t inside a text node!')
            }
            const text = target.text
            if (off <= 0) {
                childBefore = { ...target, text: '' }
                childAfter = target
            } else if (off >= text.length) {
                childBefore = target
                childAfter = { ...target, text: '' }
            } else {
                childBefore = { ...target, text: text.slice(0, off) }
                childAfter = { ...target, text: text.slice(off) }
            }
        } else {
            // dive one level deeper
            if (!SlateElement.isElement(target)) {
                throw new Error('Split path too deep!')
            }
            ;[childBefore, childAfter] = splitNodeAt(
                target,
                path.slice(1),
                off
            )
        }

        // Only siblings _before_ go to the first half, and only siblings _after_ go to the second
        const first = { ...el, children: [...beforeSibs, childBefore] }
        const second = { ...el, children: [childAfter, ...afterSibs] }
        return [first, second]
    }

    // 4) Do the split
    const [firstBlock, secondBlock] = splitNodeAt(
        blockNode,
        relPath,
        offset
    )

    // 5) Serialize each into Markdown
    const currentMd = serializeMarkdownBlock(
        (firstBlock as SlateElement).children as Descendant[]
    )
    const newMd = serializeMarkdownBlock(
        (secondBlock as SlateElement).children as Descendant[]
    )

    return {
        currentBlockId: blockNode.id,
        currentBlockMarkdown: currentMd,
        newBlockMarkdown: newMd,
    }
}


