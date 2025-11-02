import React from 'react';
import { RenderElementProps, RenderLeafProps } from 'slate-react';
import { LinkElement } from './Link';
import { HeadingElement, ListElement, ListItemElement, MarkdownBlockElement } from './Markdown';
import { TrackedChangeElement, TrackedChangeElementComponent } from './TrackedChanges';

export const Element = (props: RenderElementProps) => {
    const { attributes, children, element } = props;

    switch ((element as any).type) {
        case 'link':
            return <LinkElement {...props} readOnly={false} />;

        case 'markdown_block':
            return <MarkdownBlockElement {...props} />;

        case 'tracked-change':
            return <TrackedChangeElementComponent {...props} element={element as TrackedChangeElement} />;

        case 'bold':
            return <strong {...props.attributes}>{props.children}</strong>;

        case 'italic':
            return <em {...props.attributes}>{props.children}</em>;

        case 'heading': {
            const heading = element as any as HeadingElement;
            const level = Math.min(Math.max(heading.depth, 1), 6);
            if (level === 1) return <h1 {...attributes}>{children}</h1>;
            if (level === 2) return <h2 {...attributes}>{children}</h2>;
            if (level === 3) return <h3 {...attributes}>{children}</h3>;
            if (level === 4) return <h4 {...attributes}>{children}</h4>;
            if (level === 5) return <h5 {...attributes}>{children}</h5>;
            if (level === 6) return <h6 {...attributes}>{children}</h6>;
            return <p {...attributes}>{children}</p>;
        }

        case 'list': {
            const e = element as any as ListElement;
            return e.ordered ? (
                <ol {...attributes} start={e.start ?? undefined}>
                    {children}
                </ol>
            ) : (
                <ul {...attributes}>
                    {children}
                </ul>
            );
        }

        case 'listItem': {
            const e = element as any as ListItemElement;
            return (
                <li {...attributes} data-checked={e.checked ?? undefined}>
                    {children}
                </li>
            );
        }

        case 'paragraph':
        case 'contentBlock':
        default:
            return <p {...attributes}>{children}</p>;
    }
};

export const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
    const l = leaf as any;

    if (l.strong) {
        children = <strong>{children}</strong>;
    }
    if (l.emphasis) {
        children = <em>{children}</em>;
    }
    if (l.code) {
        children = <code>{children}</code>;
    }
    if (l.underline) {
        children = <u>{children}</u>;
    }
    if (l.strikethrough) {
        children = <s>{children}</s>;
    }
    if (l['read-only']) {
        children = <span className="read-only">{children}</span>;
    }
    if (l.highlighted) {
        children = <mark>{children}</mark>;
    }

    return <span {...attributes}>{children}</span>;
};
