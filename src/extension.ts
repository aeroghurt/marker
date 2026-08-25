import * as vscode from 'vscode';

const document = vscode.window.activeTextEditor?.document;

export async function activate(context: vscode.ExtensionContext) {


	// let createMarker = vscode.commands.registerCommand('marker.createNewMarker', async () => {
	// 		const editor = vscode.window.activeTextEditor;

	// 		if (!editor || !document) {
	// 			vscode.window.showWarningMessage(`No active editor found.`);
	// 			return;
	// 		}

	// 		const selection = editor.selection;
	// 		const start = selection.start;
	// 		const end = selection.end;
	// 		const range = new vscode.Range(start, end);
			
	// 		// gets file path
	// 		const documentUri = editor.document.uri.toString();

	// 		// change Category[] into string[] to be allowed in vscode.window.showQuickPick()
	// 		const existingCategoriesConverted = existingCategories.map(item => ({
	// 			label: item.name,
	// 			colour: item.colour,
	// 			originalRef: item
	// 		}));

	// 		// gets the category the user selected
	// 		const quickPick = await vscode.window.showQuickPick(
	// 			existingCategoriesConverted, {
	// 				placeHolder: 'Select from existing categories'
	// 			}
	// 		);
			
	// 		if (quickPick) {
	// 			markers.set(range, {document: documentUri, range: range, hoverString: new vscode.Hover(`Category:\n\n${quickPick}`)}); // stores it in existingMarkers according to the file path and markers inside
	// 			const decorationType = vscode.window.createTextEditorDecorationType({
	// 				backgroundColor: quickPick.colour + `4D`, // along with the background color, sets bg opacity to 30%
	// 				isWholeLine: true,
	// 			});
	// 			editor.setDecorations(decorationType, [range]);
	// 		}
	// 	}
	// );

	// let deleteMarker = vscode.commands.registerCommand('marker.deleteMarker', () => {
	// 	const editor = vscode.window.activeTextEditor;
	// 	if (!editor) {
	// 		return;
	// 	}

	// 	const cursorPos = editor.selection.active;
	// 	const fileName = editor.document.uri.toString();

	// 	// markers.set(fileName, markers.get(fileName)!.filter((marker: any) => {
	// 	// 	return !marker.contains(cursorPos);



	// });

	// let deleteAll = vscode.commands.registerCommand('marker.deleteAllMarkers', () => {
	// 	return;
	// });

	// let	createCategory = vscode.commands.registerCommand('marker.createNewCategory', () => {
	// 		const panel = vscode.window.createWebviewPanel(
	// 			'panel',
	// 			'Create a new category',
	// 			vscode.ViewColumn.One,
	// 			{
	// 				enableScripts: true
	// 			}
				
	// 		);

	// 		panel.webview.html = getWebViewContent();

	// 		panel.webview.onDidReceiveMessage(
	// 			message => {
	// 				switch (message.command) {
	// 					case 'getInfo':
	// 						const colour = message.colour;
	// 						const category = message.category;
	// 						existingCategories.push(new Category(category, colour));
	// 						break;
	// 					case 'closeWindow':
	// 						panel.dispose();
	// 						break;
	// 					case 'error':
	// 						vscode.window.showErrorMessage(message.error);
	// 						break;
	// 				}
	// 			},
	// 			undefined,
	// 			context.subscriptions
	// 		);
	// });

	// let changeEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
	// 	if (editor) {
	// 		reapply(editor);
	// 	}
	// }, null, context.subscriptions);

	// context.subscriptions.push(createMarker, deleteMarker, deleteAll, createCategory, changeEditor);

	// context.subscriptions.push(
	// 	vscode.languages.registerHoverProvider('*', {
	// 		provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
	// 			return;
	// 		}
	// 	}
	// ));
}

interface Marker {
	id: string;
	start: number;
	end: number;
	text: string;
}

interface MarkerInfo {
	markerId: string;
	start: number;
	end: number;
	text: string;
}

function compareAndUpdate(
	oldText: string,
	newText: string,
	markers: Marker[]
): Marker[] {
	const updated: Marker[] = [];

	for (const m of markers) {
		const content = m.text || oldText.substring(m.start, m.end);
		if (!content) {
			continue;
		}

		// if a user adds new characters to a marked line, gets its index which will be then pushed to updated 
		const newIndex = newText.indexOf(content);
		// checks if the marker is still there, if it still is, then pushes a shallow copy of m to updated
		if (newIndex !== -1) {
			updated.push({
				...m,
				start: newIndex,
				end: newIndex + content.length,
				text: content
			});
		}
	}

	return updated;
}

// returns info about the marker that contains the given character offset, returns null if it's not in any marker
function getMarkerInfo(
	text: string,
	offset: number,
	markers: Marker[]
): MarkerInfo | null{
	for (const m of markers) {
		if (m.start <= offset && offset < m.end) {
			return {
				markerId: m.id,
				start: m.start,
				end: m.end,
				text: text.substring(m.start, m.end)
			};
		}
	}
	return null;
}

// basically onDidChangeTextDocument event but with a tiny change
interface ContentChange {
	rangeOffset: number; // start offset of the replaced range 
	rangeLength: number; // length of the replaced range (0 for pure insertions)
	text: string; // replacement text
}

function adjustForChanges(
	markers: Marker[],
	changes: readonly ContentChange[]
): Marker[] {
	// processes last changes first
	const sorted = [...changes].sort((a, b) => b.rangeOffset - a.rangeOffset);

	let result: Marker[] = [...markers];

	for (const change of sorted){
		const co = change.rangeOffset;
		const cl = change.rangeLength;
		const nl = change.text.length;
		const editEnd = co + cl;
		const delta = nl - cl; // overall character shift

		const next: Marker[] = [];

		for (const m of result) {
			const s = m.start;
			const e = m.end;

			// edit is after the marker -> no change 
			if (co >= e) {
				next.push(m); 
				continue;
			}

			// edit is completely before the marker
			if (editEnd <= s) {
				next.push({ ...m, start: s + delta, end: e + delta });
				continue;
			}

			// edit completely covers the marker
			if (co <= s && editEnd >= e) {
				if (nl === 0) {
					continue;
				}

				next.push({ ...m, start: co, end: co + nl});
				continue;
			}
			next.push(m);
		}
		result = next.filter(m => m.start < m.end);
	}
	return result;
}

function createMarker(
	id: string,
	start: number,
	end: number,
	text: string
): Marker{
	return {id, start, end, text};
}
// let markers = new Map<vscode.Range, markersInterface>();

// class Category {
// 	public name: string; colour: string;
// 	constructor(name: string, colour: string) {
// 		this.name = name;
// 		this.colour = colour;
// 	}
// }

// let existingCategories: Category[] = [];

// function getWebViewContent() {
// 	return `<!DOCTYPE html>
// 	<html lang='en'>
// 	<head>
// 		<meta charset="UTF-8">
// 		<meta name="viewport" content="width=device-width, initial-scale=1.0">
// 		<title>Create a new category</title>
// 	</head>
// 	<body>
// 		<form>
// 			<label>New category</label>
// 			<input id="category" type="text">
// 			<label>Colour</label>
// 			<input id="colour" type="color">
// 			<input id="submit" type="submit" value="Create">
// 		</form>
// 		<script>
// 			const vscode = acquireVsCodeApi();
// 			let categoryInput;
// 			let colourInput;
// 			document.getElementById('colour').addEventListener('input', (event) => {
// 				colourInput = event.target.value;
// 			})
// 			document.getElementById('submit').onclick = () => {
// 				categoryInput = document.getElementById('category').value;
// 				if (category !== undefined && colour !== '#000000') {
// 					vscode.postMessage({
// 						command: 'getInfo',
// 						category: categoryInput,
// 						colour: colourInput
// 					})
// 					vscode.postMessage({
// 						command: 'closeWindow'
// 					})
// 				} else {
// 					vscode.postMessage({
// 						command: 'error',
// 						error: 'Error, could not create new category.'
// 					})
// 				}
// 			}
// 		</script>
// 	</body>`;
// }

// function reapply(editor: vscode.TextEditor) {
	
// }

export function deactivate() {}