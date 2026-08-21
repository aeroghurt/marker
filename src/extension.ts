import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('marker.createNewMarker', addMarker);
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('marker.deleteMarker', deleteMarker);
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('marker.deleteAllMarkers', deleteAllMarkers);
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('marker.createNewCategory', createNewCategory);
	context.subscriptions.push(disposable);

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			reapply(editor);
		}
	}, null, context.subscriptions);
}

let markers: Map<string, vscode.Range[]> = new Map();

function addMarker() {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		vscode.window.showWarningMessage(`No active editor found.`);
		return;
	}

	const selection = editor.selection;
	const start = selection.start;
	const end = selection.end;
	const range = new vscode.Range(start, end);

	const documentUri = editor.document.uri.toString();
	const existingMarkers = markers.get(documentUri) || [];
	existingMarkers.push(range);
	markers.set(documentUri, existingMarkers);
}

function deleteMarker() {

}

function deleteAllMarkers() {
	
}

function createNewCategory() {
	const newCategory = vscode.window.createWebviewPanel(
		'newCategory',
		'Create a new category',
		vscode.ViewColumn.One,
		{}
	);
	newCategory.webview.html = getWebViewContent();
}

function getWebViewContent() {
	return `<!DOCTYPE html>
	<html lang='en'>
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Create a new category</title>
	</head>
	<body>

	</body>`;
}

function reapply(editor: vscode.TextEditor) {
	
}
		// const editor = vscode.window.activeTextEditor;

		// if (!editor) {
		// 	return;

		// const document = editor.document;
		// const selection = editor.selection;
		// const selectedText = editor.document.getText(selection);

		// const documentUri = editor.document.uri.toString();
		// const existingHighlights= marker.get(documentUri) || [];

		// if (!selectedText || selectedText.trim().length === 0) {
		// 	vscode.window.showWarningMessage(`No text selected.`);
		// 	return;
		// }

		// context.subscriptions.push(disposable);



export function deactivate() {}