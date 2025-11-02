import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { createEditor, Descendant, Transforms, Editor, Element as SlateElement, BaseElement } from 'slate';
import { Editable, Slate, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import { SlateToolbar } from './SlateToolbar';
import '../types/slate.d.ts';

// Simple markdown deserializer
function deserialize(content: string): Descendant[] {
	if (!content || content.trim() === '') {
		return [{ type: 'paragraph', children: [{ text: '' }] } as any];
	}
	
	// For now, split by lines and create paragraphs
	const lines = content.split('\n');
	return lines.map(line => ({
		type: 'paragraph',
		children: [{ text: line }]
	} as any));
}

// Simple markdown serializer
function serialize(nodes: Descendant[]): string {
	return nodes.map(n => {
		const element = n as BaseElement & { children: any[] };
		const text = element.children?.map((c: any) => c.text || '').join('') || '';
		return text;
	}).join('\n');
}

// Element renderer
const Element: FunctionComponent<RenderElementProps> = ({ attributes, children, element }) => {
	const el = element as any;
	switch (el.type) {
		case 'heading-one':
			return <h1 {...attributes}>{children}</h1>;
		case 'heading-two':
			return <h2 {...attributes}>{children}</h2>;
		case 'heading-three':
			return <h3 {...attributes}>{children}</h3>;
		case 'block-quote':
			return <blockquote {...attributes}>{children}</blockquote>;
		case 'bulleted-list':
			return <ul {...attributes}>{children}</ul>;
		case 'numbered-list':
			return <ol {...attributes}>{children}</ol>;
		case 'list-item':
			return <li {...attributes}>{children}</li>;
		case 'code-block':
			return <pre><code {...attributes}>{children}</code></pre>;
		default:
			return <p {...attributes}>{children}</p>;
	}
};

// Leaf renderer
const Leaf: FunctionComponent<RenderLeafProps> = ({ attributes, children, leaf }) => {
	const l = leaf as any;
	if (l.bold) {
		children = <strong>{children}</strong>;
	}
	if (l.italic) {
		children = <em>{children}</em>;
	}
	if (l.underline) {
		children = <u>{children}</u>;
	}
	if (l.code) {
		children = <code>{children}</code>;
	}
	return <span {...attributes}>{children}</span>;
};

export const SlateEditor: FunctionComponent<{
	initialContent: string;
	onChange: (content: string) => void;
	onReady?: (instance: any) => void;
}> = ({ initialContent, onChange, onReady }) => {
	const editor = useMemo(() => withHistory(withReact(createEditor())), []);
	const [value, setValue] = useState<Descendant[]>(() => deserialize(initialContent));

	// Expose setContent method
	useEffect(() => {
		if (onReady) {
			onReady({
				setContent: (content: string) => {
					const newValue = deserialize(content);
					setValue(newValue);
					Transforms.delete(editor, {
						at: {
							anchor: Editor.start(editor, []),
							focus: Editor.end(editor, []),
						},
					});
					Transforms.insertNodes(editor, newValue);
				}
			});
		}
	}, [editor, onReady]);

	const handleChange = useCallback((newValue: Descendant[]) => {
		setValue(newValue);
		const content = serialize(newValue);
		onChange(content);
	}, [onChange]);

	const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
	const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);

	return (
		<div className="slate-editor-container">
			<Slate editor={editor} initialValue={value} onChange={handleChange}>
				<SlateToolbar />
				<div className="editor-content">
					<Editable
						renderElement={renderElement}
						renderLeaf={renderLeaf}
						placeholder="Start typing your markdown content..."
						spellCheck
						autoFocus
					/>
				</div>
			</Slate>
		</div>
	);
};
