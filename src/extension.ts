import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './editor/MarkdownEditorProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Knowing Markdown Editor is now active!');

	// Register the custom editor provider
	const provider = new MarkdownEditorProvider(context);
	const registration = vscode.window.registerCustomEditorProvider(
		'knowingMarkdownEditor.editor',
		provider,
		{
			webviewOptions: {
				retainContextWhenHidden: true,
			},
			supportsMultipleEditorsPerDocument: false,
		}
	);

	context.subscriptions.push(registration);

	// Register command to open editor
	const openEditorCommand = vscode.commands.registerCommand(
		'knowing-markdown-editor.openEditor',
		() => {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'markdown') {
				vscode.commands.executeCommand(
					'vscode.openWith',
					editor.document.uri,
					'knowingMarkdownEditor.editor'
				);
			} else {
				vscode.window.showInformationMessage('Please open a markdown file first.');
			}
		}
	);

	context.subscriptions.push(openEditorCommand);
}

export function deactivate() {}
