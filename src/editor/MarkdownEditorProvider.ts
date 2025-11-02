import * as vscode from 'vscode';
import { getNonce } from './utils';

export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
	private static readonly viewType = 'knowingMarkdownEditor.editor';

	constructor(private readonly context: vscode.ExtensionContext) {}

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Setup webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		// Update webview content when document changes
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				this.updateWebview(webviewPanel, document);
			}
		});

		// Make sure we dispose of the subscription when the editor is closed
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive messages from the webview
		webviewPanel.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'update':
					this.updateTextDocument(document, e.content);
					return;
			}
		});

		// Initial content
		this.updateWebview(webviewPanel, document);
	}

	private updateWebview(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
		panel.webview.postMessage({
			type: 'update',
			content: document.getText(),
		});
	}

	private updateTextDocument(document: vscode.TextDocument, content: string) {
		const edit = new vscode.WorkspaceEdit();
		
		// Replace entire document content
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			content
		);

		return vscode.workspace.applyEdit(edit);
	}

	private getHtmlForWebview(webview: vscode.Webview): string {
		// Get URIs for the webview scripts and styles
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js')
		);

		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'media', 'reset.css')
		);

		const styleVSCodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vscode.css')
		);

		const styleMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css')
		);

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				<title>Knowing Markdown Editor</title>
			</head>
			<body>
				<div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
