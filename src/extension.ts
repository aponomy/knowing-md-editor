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
		async (uri?: vscode.Uri) => {
			// If URI is provided (from context menu), use it
			// Otherwise, try to get URI from active editor
			const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
			
			if (!targetUri) {
				vscode.window.showInformationMessage('Please open or select a markdown file first.');
				return;
			}

			// Check if it's a markdown file
			const document = await vscode.workspace.openTextDocument(targetUri);
			if (document.languageId !== 'markdown') {
				vscode.window.showWarningMessage('This command only works with markdown files.');
				return;
			}

			// Open with our custom editor
			await vscode.commands.executeCommand(
				'vscode.openWith',
				targetUri,
				'knowingMarkdownEditor.editor'
			);
		}
	);

	context.subscriptions.push(openEditorCommand);
}

export function deactivate() {}
