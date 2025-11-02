import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createEditor, Descendant, Editor, Range, Element as SlateElement, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, withReact } from 'slate-react';
import { deserialize } from '../slate/Parts/Deserialize';
import { Element, Leaf } from '../slate/Parts/Element';
import { LinkEditor } from '../slate/Parts/Link';
import { withMarkdown } from '../slate/Parts/Markdown';
import { serialize } from '../slate/Parts/Serialize';
import { SlateMarkdownToolbar, toggleEditorMark } from '../slate/SlateToolbar';

// Helper function for plain paste
const withPlainPaste = (editor: Editor) => {
    const { insertData } = editor;
    
    editor.insertData = (data: DataTransfer) => {
        const text = data.getData('text/plain');
        
        if (text) {
            const lines = text.split('\n');
            lines.forEach((line, i) => {
                if (i > 0) {
                    Transforms.insertNodes(editor, {
                        type: 'paragraph',
                        children: [{ text: line }],
                    } as any);
                } else {
                    Transforms.insertText(editor, line);
                }
            });
        } else {
            insertData(data);
        }
    };
    
    return editor;
};

// Helper to set editor selection safely
const setEditorSelection = (editor: Editor, selection: Range) => {
    try {
        Transforms.select(editor, selection);
    } catch (e) {
        console.error('Error setting selection:', e);
    }
};

export const SlateEditor: FunctionComponent<{
    value: string,
    onChange: (value: string) => void,
    autofocus?: boolean,
    placeholder?: string,
    editableStyle?: React.CSSProperties,
    disabled?: boolean,
    hideMarks?: boolean,
    onUndo?: (redo?: boolean) => any,
    onFocus?: () => any,
    onBlur?: () => any,
    onPressEnter?: () => any,
    onContextMenu?: (e: React.MouseEvent) => any,
    onReady?: (instance: any) => void
}> = (props) => {

    const editor = useMemo(() => withPlainPaste(withMarkdown(withHistory(withReact(createEditor())))), []);

    const [draggingElementPath, setDraggingElementPath] = useState<number[] | null>(null);

    const initialValue = useMemo(() => deserialize(props.value), []);
    const lastValueRef = useRef<string>(props.value);

    // Expose setContent method for VS Code integration
    useEffect(() => {
        if (props.onReady) {
            props.onReady({
                setContent: (content: string) => {
                    const newValue = deserialize(content);
                    // Clear editor
                    Transforms.delete(editor, {
                        at: {
                            anchor: Editor.start(editor, []),
                            focus: Editor.end(editor, []),
                        },
                    });
                    // Insert new content
                    Transforms.removeNodes(editor, { at: [0] });
                    Transforms.insertNodes(editor, newValue);
                    lastValueRef.current = content;
                }
            });
        }
    }, [editor, props.onReady]);

    // Ensure editor has initial selection when content is available
    useEffect(() => {
        if (props.autofocus && editor.children.length > 0) {
            setTimeout(() => {
                try {
                    ReactEditor.focus(editor);
                    
                    // Find first markdown block or set selection at start
                    let markdownBlockFound = false;
                    for (const [node, path] of Editor.nodes(editor, {
                        at: [],
                        mode: 'all'
                    })) {
                        if (SlateElement.isElement(node) && (node as any).type === 'markdown_block') {
                            const start = Editor.start(editor, path);
                            setEditorSelection(editor, { anchor: start, focus: start });
                            markdownBlockFound = true;
                            break;
                        }
                    }

                    if (!markdownBlockFound) {
                        const start = Editor.start(editor, []);
                        setEditorSelection(editor, { anchor: start, focus: start });
                    }
                } catch (e) {
                    console.error('Error setting initial selection:', e);
                }
            }, 100);
        }
    }, [props.autofocus, editor]);

    // Handle value changes
    const handleChange = useCallback((newValue: Descendant[]) => {
        const isAstChange = editor.operations.some(op => op.type !== 'set_selection');

        if (isAstChange) {
            const serializedValue = serialize(newValue);
            const newMarkdown = typeof serializedValue === 'string' ? serializedValue : JSON.stringify(serializedValue);

            if (newMarkdown !== lastValueRef.current) {
                lastValueRef.current = newMarkdown;
                props.onChange(newMarkdown);
            }
        }
    }, [editor.operations, props]);

    // Keyboard event handler
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        // Handle Enter key
        if (event.key === 'Enter' && !event.shiftKey) {
            if (props.onPressEnter) {
                event.preventDefault();
                props.onPressEnter();
                return;
            }
        }

        // Handle undo/redo
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
            event.preventDefault();
            if (event.shiftKey) {
                editor.undo();
                props.onUndo?.(true);
            } else {
                editor.redo();
                props.onUndo?.(false);
            }
            return;
        }

        // Handle formatting shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'b':
                    event.preventDefault();
                    toggleEditorMark(editor, 'strong');
                    break;
                case 'i':
                    event.preventDefault();
                    toggleEditorMark(editor, 'emphasis');
                    break;
                case 'u':
                    event.preventDefault();
                    toggleEditorMark(editor, 'underline');
                    break;
            }
        }
    }, [editor, props]);

    // Render element callback
    const renderElement = useCallback((props: RenderElementProps) => (
        <Element {...props} />
    ), []);

    // Render leaf callback
    const renderLeaf = useCallback((props: RenderLeafProps) => (
        <Leaf {...props} />
    ), []);

    return (
        <div className="slate-editor-container">
            <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
                {!props.hideMarks && <SlateMarkdownToolbar />}
                
                <div className="editor-content" style={props.editableStyle}>
                    <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        placeholder={props.placeholder || 'Start typing...'}
                        spellCheck
                        autoFocus={props.autofocus}
                        readOnly={props.disabled}
                        onKeyDown={handleKeyDown}
                        onFocus={props.onFocus}
                        onBlur={props.onBlur}
                        onContextMenu={props.onContextMenu}
                    />
                </div>

                <LinkEditor />
            </Slate>
        </div>
    );
};
