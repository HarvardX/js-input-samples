'use strict';

// If the student comes to this problem for the first time,
// they start with a blank.
var JSProblemState = {
	files: [],
};

/** Create the file drop area and set up listeners. No parameters. */
function init() {

	// Create a file-drop area for processing.
	const fileDropArea = document.getElementById('file-drop-area');

	// Add event listeners for drag and drop functionality.
	fileDropArea.addEventListener('dragover', (event) => {
		event.preventDefault();
		fileDropArea.classList.add('dragover');
	});

	fileDropArea.addEventListener('dragleave', (event) => {
		event.preventDefault();
		fileDropArea.classList.remove('dragover');
	});

	fileDropArea.addEventListener('drop', (event) => {
		event.preventDefault();
		fileDropArea.classList.remove('dragover');
		const files = event.dataTransfer.files;
		handleFiles(files);
	});

}
window.addEventListener('load', init);


// This wrapper function is necessary.
// You can rename it if you want, just make sure the attributes
// in your <jsinput> tag match the function name here.
// This wrapper function is necessary.
var file_comparison = (function () {

	// REQUIRED --- DO NOT REMOVE/CHANGE!!
	var channel;

	// REQUIRED --- DO NOT REMOVE/CHANGE!!
	if (window.parent !== window) {
		channel = Channel.build({
			window: window.parent,
			origin: "*",
			scope: "JSInput"
		});
		channel.bind("getGrade", getGrade);
		channel.bind("getState", getState);
		channel.bind("setState", setState);

	}

	// getState() and setState() are required by the problem type.
	function getState() {
		console.log('getting state');
		return JSON.stringify(JSProblemState);
	}

	function setState() {
		console.log('setting state');
		let stateStr = arguments.length === 1 ? arguments[0] : arguments[1];
		JSProblemState = JSON.parse(stateStr);
		// Configure the problem so that it matches its previous state.


	}


	function getGrade() {
		console.log('getting grade');

		// Log the problem state. 
		// This is called from the parent window's Javascript so that we can write to the official edX logs. 
		parent.logThatThing(JSProblemState);

		// Return the whole problem state.
		return JSON.stringify(JSProblemState);
	}

	// REQUIRED --- DO NOT REMOVE/CHANGE!!
	return {
		getState: getState,
		setState: setState,
		getGrade: getGrade
	};

}());

/** Just here for now; will be replacing with something more extensive. */
function handleFiles(files) {
	for (const f of files) {
		const reader = new FileReader();
		reader.onload = (event) => {
			const file_content = event.target.result;
			processFile(f, file_content);
		};
		reader.readAsText(f);
	}
}

/**
 * 
 * @param {*} file_content
 */
function processFile(file, file_content) {
	let info_area = document.getElementById('info-area');

	// Give us the basics about the file.
	let info_html = '<p>Name: ' + file.name + '</p>';
	info_html += '<p>Type: ' + file.type + '</p>';
	info_html += '<p>Size: ' + file.size + ' bytes</p>';
	info_area.innerHTML = info_html;


	if (file.type.indexOf('text') > -1) {
		console.log(`Content: ${file_content}`);

		// Show the full content as preformatted text.

		var textData = new FileReader();
		const outputArea = document.querySelector("#output-area");
		textData.onload = function (event) {
			var rawText = event.target.result;
			outputArea.innerHTML += '<pre></pre>';
			outputArea.querySelector('pre:last-child').textContent = rawText;
		};

		textData.onerror = function (event) {
			console.error('File could not be read! Code ' + event.target.error.code);
			JSProblemState.uploadedRightThing = false;
		};

		textData.readAsText(file);

	} else {

		// This is not what we asked for.
		let outputArea = document.querySelector("#output-area");

		outputArea.innerHTML += '<p>That is not a text file.</p>';
		JSProblemState.uploadedRightThing = false;

	}

}


/**
 * Hashes text to SHA256 for the purpose of comparing answers without revealing the answer itself.
 * Taken from https://stackoverflow.com/a/70243259/1330737
 *
 * @param {string} source
 * @returns {Promise<string>}
 */
async function sha256(source) {
	const sourceBytes = new TextEncoder().encode(source);
	const digest = await crypto.subtle.digest("SHA-256", sourceBytes);
	const resultBytes = [...new Uint8Array(digest)];
	return resultBytes.map((x) => x.toString(16).padStart(2, "0")).join("");
}

// Just letting us know that the iframe is working.
console.log("inner ready");
