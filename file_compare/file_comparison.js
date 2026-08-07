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
	const options = getOptions();

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
		readFiles(files, options);
	});

	// Let people click on the area to open a file dialog 
	// in case they can't drag.
	fileDropArea.addEventListener('click', () => {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.multiple = true; // Allow multiple files to be selected.
		fileInput.addEventListener('change', (event) => {
			const files = event.target.files;
			readFiles(files, options);
		});
		fileInput.click();
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


/** 
 * Reads in the learner files and returns most of the info as an object.
 * 
 * @param {FileList} files - The list of files uploaded by the learner.
 * @param {Object} options - The options for the file comparison, as defined in the XML.
 * 
 * @returns {Promise<Object>} An object containing the file information.
 */
async function readFiles(files, options) {
	let all_file_content = {};
	for (const f of files) {
		const reader = new FileReader();
		await new Promise((resolve, reject) => {
			reader.onload = (event) => {
				const file_content = event.target.result;
				console.log(f);
				all_file_content[f.name] = {
					"content": file_content,
					"size": f.size,
					"type": f.type
				};
				resolve();
			};
			reader.onerror = (event) => {
				reject(event.target.error);
			};
			reader.readAsText(f);
		});
	}
	await processFiles(all_file_content, options);
}

/**
 * Compares file content uploaded by learners to the correct answers.
 * @param {*} all_file_content
 */
async function processFiles(all_file_content, options) {
	for (const fileName in all_file_content) {
		const f = all_file_content[fileName];
		f.name = fileName;

		if (
			f.type.indexOf('text') === -1 &&
			f.type.indexOf('json') === -1 &&
			f.type.indexOf('javascript') === -1 &&
			f.type.indexOf('python') === -1
		) {
			// This is not a text file.
			let outputArea = document.querySelector("#output-area");
			outputArea.innerHTML += '<p>' + f.name + ' is not a text file.</p>';
			JSProblemState.uploadedRightThing = false;
			console.log(f.name);
			console.log(f.type);
		}
		else {
			// Yay it's a text file!
			displayFileInfo(f);
			// console.log(`Content: ${all_file_content[f.name].content}`);
		}
	}

}


/** 
 * Pulls options from the HTML on the page.
 * These are declared in Python on edX and inserted into the HTML.
 */
function getOptions() {
	let options_div = document.querySelector('.hx-comparison-options');
	let options = JSON.parse(options_div.textContent.trim());
	console.log(options);
	return options;
}

/** Puts basic info about the uploaded file into the info area. */
function displayFileInfo(file_info) {
	let info_area = document.getElementById('info-area');

	let info_html = '<p>Name: ' + file_info.name + '</p>';
	info_html += '<p>Type: ' + file_info.type + '</p>';
	info_html += '<p>Size: ' + file_info.size + ' bytes</p>';
	info_area.innerHTML += info_html;
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
