import React from 'react';
import { useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement } from 'slate';

export const toggleEditorMark = (editor: Editor, format: 'strong' | 'emphasis' | 'underline' | 'code') => {
    const isActive = isMarkActive(editor, format);
    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

export const isMarkActive = (editor: Editor, format: string) => {
    const marks: any = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

export const insideMarkdownBlock = (editor: Editor): boolean => {
    const [match] = Editor.nodes(editor, {
        match: n => SlateElement.isElement(n) && (n as any).type === 'markdown_block',
    });
    return !!match;
};

const MarkButton: React.FC<{ format: 'strong' | 'emphasis' | 'underline' | 'code'; label: string }> = ({ format, label }) => {
    const editor = useSlate();
    const isActive = isMarkActive(editor, format);
    
    return (
        <button
            className={`toolbar-button ${isActive ? 'active' : ''}`}
            onMouseDown={(event) => {
                event.preventDefault();
                toggleEditorMark(editor, format);
            }}
            type="button"
        >
            {label}
        </button>
    );
};

export const SlateMarkdownToolbar: React.FC = () => {
    return (
        <div className="slate-toolbar">
            <MarkButton format="strong" label="Bold" />
            <MarkButton format="emphasis" label="Italic" />
            <MarkButton format="underline" label="Underline" />
            <MarkButton format="code" label="Code" />
        </div>
    );
};
