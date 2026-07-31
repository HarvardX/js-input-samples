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
	fileDropArea.className = 'drop-area';
	fileDropArea.innerHTML = 'Drop files here';
	document.body.appendChild(fileDropArea);

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
	for (const file of files) {
		const reader = new FileReader();
		reader.onload = (event) => {
			const fileContent = event.target.result;
			console.log(`File: ${file.name}, Content: ${fileContent}`);
			// Here you can add code to process the file content as needed.
		};
		reader.readAsText(file);
	}
}

/**
 * 
 * @param {*} file 
 * @param {*} outputArea 
 * @param {*} infoArea 
 */
function processFile(file, outputArea, infoArea) {

	JSProblemState.uploadedRightThing = true;

	// Give us the basics about the file.
	infoArea.append('<p>Filename: ' + file.name + '</p>');
	infoArea.append('<p>Type: ' + file.type + '</p>');
	infoArea.append('<p>Size: ' + file.size + ' bytes</p>');

	if (file.type.indexOf('image') > -1) {

		// Display a small preview of the image. Using Data URI approach to load.

		var imageData = new FileReader();
		imageData.onload = function (event) {
			var dataUri = event.target.result,
				img = document.createElement('img');

			img.src = dataUri;
			outputArea.append(img);
		};

		imageData.onerror = function (event) {
			console.error('File could not be read! Code ' + event.target.error.code);
			JSProblemState.uploadedRightThing = false;
		};

		imageData.readAsDataURL(file);

		JSProblemState

	} else if (file.type.indexOf('text') > -1) {

		// Show the full content as preformatted text.

		var textData = new FileReader();
		textData.onload = function (event) {
			var rawText = event.target.result;
			outputArea.append('<pre></pre>');
			$('pre:last-child').text(rawText).html();
		};

		textData.onerror = function (event) {
			console.error('File could not be read! Code ' + event.target.error.code);
			JSProblemState.uploadedRightThing = false;
		};

		textData.readAsText(file);

	} else {

		// This is not what we asked for.
		outputArea.append('<p>That is not an image or text file.');
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
