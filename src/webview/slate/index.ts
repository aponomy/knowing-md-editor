import { BaseEditor, Descendant } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';
import { LinkElement } from './Parts/Link';
import { CodeElement, CustomText, HeadingElement, ListElement, ListItemElement, MarkdownElement } from './Parts/Markdown';
import { TrackedChangeElement } from './Parts/TrackedChanges';

// Extend the Slate module to include custom types
declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor & HistoryEditor;
        Element: 
            | ParagraphElement
            | BoldElement
            | ItalicElement
            | LinkElement
            | MarkdownElement
            | HeadingElement
            | ListElement
            | ListItemElement
            | CodeElement
            | TrackedChangeElement;
        Text: CustomText;
    }
}

export type ParagraphElement = {
    type: 'paragraph';
    children: Descendant[];
}

export type BoldElement = {
    type: 'bold';
    children: Descendant[];
};

export type ItalicElement = {
    type: 'italic';
    children: Descendant[];
};

export { getMarkedText } from './Parts/Markdown';
export { createTrackedChangeElement, isTrackedChangeElement, parseTrackedChangeFromMarkdown, serializeTrackedChange, TrackedChangeElementComponent } from './Parts/TrackedChanges';
export type { TrackedChangeElement } from './Parts/TrackedChanges';
