import React, { FunctionComponent } from 'react';
import { useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement } from 'slate';

const isMarkActive = (editor: Editor, format: string) => {
	const marks: any = Editor.marks(editor);
	return marks ? marks[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
	const isActive = isMarkActive(editor, format);
	if (isActive) {
		Editor.removeMark(editor, format);
	} else {
		Editor.addMark(editor, format, true);
	}
};

const MarkButton: FunctionComponent<{ format: string; icon: string }> = ({ format, icon }) => {
	const editor = useSlate();
	return (
		<button
			className={isMarkActive(editor, format) ? 'active' : ''}
			onMouseDown={(event: React.MouseEvent) => {
				event.preventDefault();
				toggleMark(editor, format);
			}}
		>
			{icon}
		</button>
	);
};

export const SlateToolbar: FunctionComponent = () => {
	return (
		<div className="slate-toolbar">
			<MarkButton format="bold" icon="B" />
			<MarkButton format="italic" icon="I" />
			<MarkButton format="underline" icon="U" />
			<MarkButton format="code" icon="<>" />
		</div>
	);
};
