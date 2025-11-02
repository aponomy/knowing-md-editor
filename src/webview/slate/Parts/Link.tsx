import React from 'react';
import { Descendant, Editor, Range, Transforms } from 'slate';
import { RenderElementProps, useSelected } from 'slate-react';

export type LinkElement = {
    type: 'link';
    url: string;
    children: Descendant[];
};

export const LinkElement = (props: RenderElementProps & { editor?: Editor; readOnly?: boolean }) => {
    const { attributes, children, element } = props;
    const linkEl = element as any as LinkElement;
    const selected = useSelected();

    return (
        <a
            {...attributes}
            href={linkEl.url}
            className={`slate-link ${selected ? 'selected' : ''}`}
            onClick={(e) => {
                e.preventDefault();
            }}
            title={linkEl.url}
        >
            {children}
        </a>
    );
};

export const LinkEditor: React.FC = () => {
    return null;
};

export const insertLink = (editor: Editor, url: string, text?: string) => {
    if (editor.selection) {
        const link: LinkElement = {
            type: 'link',
            url,
            children: text ? [{ text }] : [{ text: url }],
        };
        Transforms.insertNodes(editor, link as any);
    }
};

export const isLinkActive = (editor: Editor) => {
    const [link] = Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && (n as any).type === 'link',
    });
    return !!link;
};

export const unwrapLink = (editor: Editor) => {
    Transforms.unwrapNodes(editor, {
        match: n => !Editor.isEditor(n) && (n as any).type === 'link',
    });
};

export const wrapLink = (editor: Editor, url: string) => {
    if (isLinkActive(editor)) {
        unwrapLink(editor);
    }

    const { selection } = editor;
    const isCollapsed = selection && Range.isCollapsed(selection);

    const link: LinkElement = {
        type: 'link',
        url,
        children: isCollapsed ? [{ text: url }] : [],
    };

    if (isCollapsed) {
        Transforms.insertNodes(editor, link as any);
    } else {
        Transforms.wrapNodes(editor, link as any, { split: true });
        Transforms.collapse(editor, { edge: 'end' });
    }
};
