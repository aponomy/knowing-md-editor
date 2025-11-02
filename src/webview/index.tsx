import React from 'react';
import ReactDOM from 'react-dom/client';
import { SlateEditor } from './components/SlateEditor';
import './styles.css';

// VS Code API
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

// Message handler
window.addEventListener('message', event => {
	const message = event.data;
	switch (message.type) {
		case 'update':
			// Update editor content from VS Code document
			if (window.editorInstance) {
				window.editorInstance.setContent(message.content);
			} else {
				window.initialContent = message.content;
			}
			break;
	}
});

// Mount React app
const root = document.getElementById('root');
if (root) {
	const reactRoot = ReactDOM.createRoot(root);
	reactRoot.render(
		<React.StrictMode>
			<SlateEditor
				initialContent={window.initialContent || ''}
				onChange={(content: string) => {
					vscode.postMessage({
						type: 'update',
						content: content
					});
				}}
				onReady={(instance: any) => {
					window.editorInstance = instance;
				}}
			/>
		</React.StrictMode>
	);
}

// Type declarations for window
declare global {
	interface Window {
		initialContent?: string;
		editorInstance?: any;
	}
}
