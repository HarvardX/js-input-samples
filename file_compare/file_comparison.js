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
				// console.log(f);
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
  // console.log(all_file_content);
  if (Object.keys(all_file_content).length !== options.correct_answers.length) {
    console.error("Did not upload all files.");
  } else{
    await compareFiles(all_file_content, options);
  }
}

/**
 * Compares file content uploaded by learners to the correct answers.
 * Returns score and comments.
 * @param {*} all_file_content
 */
async function compareFiles(all_file_content, options) {
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

			// Go get the file to compare to.
			let correct_file_content = await retrieveFile(f.name);
			// console.log('Correct file content:');
			// console.log(correct_file_content);
			let submitted_file_content = f.content;
			let correct_by_line = correct_file_content.split('\n');
			let submitted_by_line = submitted_file_content.split('\n');


			// "credit_options": {
			//   "blank_lines": 0.8,
			//   "case": 0.6,
			//   "spaces": 0.9,
			//   "low_cutoff": 0.5,
			//   "high_cutoff": 0.9,
			//   "participation_points": 0.2
			// }

			let apply_partial_credit = {
				"blank_lines": false,
				"case": false,
				"spaces": false
			}

			// Compare the two files line by line.
			let total_credit = 1;
			let offset = 0;
			for (let i = 0; i < correct_by_line.length; i++) {
				console.log('Comparing line ' + (i + 1));
				if (i + offset >= submitted_by_line.length) {
					console.log('Ran out of lines in submitted file.');
					break;
				}
				if (correct_by_line[i] === submitted_by_line[i + offset]) {
					// Perfect match, everything's great.
					console.log('Perfect match on line ' + (i + 1));
					continue;
				} else {
					// Imperfect match, check for partial credit.
					let cl = correct_by_line[i].trim();
					let sl = submitted_by_line[i + offset].trim();
					if (cl !== sl) {
						if (cl.toLowerCase() === sl.toLowerCase()) {
							console.log("Line " + (i + 1) + " is the same except for case.");
							apply_partial_credit.case = true;
						} else {
							console.log("Line " + (i + 1) + " is entirely different. Done comparing.");
							total_credit = 0;
							break;
						}
					} else {
						console.log("Line " + i + "matches except for whitespace at either end.");
						apply_partial_credit.spaces = true;
						if (correct_by_line[i] === "" && submitted_by_line[i + offset] !== "") {
							// The correct file has a blank line, but the submitted file does not.
							// Hold back our count on the submitted file by one line.
							console.log("Holding back one line at " + (i + 1) + " in the submitted file because the correct file has a blank line.");
							apply_partial_credit.blank_lines = true;
							offset--;
						} else if (correct_by_line[i] !== "" && submitted_by_line[i + offset] === "") {
							// The submitted file has a blank line, but the correct file does not.
							// Move forward the line we're examining in the submitted file by one line.
							console.log("Moving forward one line at " + (i + 1) + " in the submitted file because the submitted file has a blank line.");
							apply_partial_credit.blank_lines = true;
							offset++;
						}
					}
				}
			}
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
  displayMessage('Name: ' + file_info.name, 'output-area', true);
  // displayMessage('Type: ' + file_info.type, 'output-area', true);
  // displayMessage('Size: ' + file_info.size + ' bytes', 'output-area', true);
}

/**
 * Displays a message in the specified area.
 * @param {string} message - The message to display.
 * @param {string} area_id - The ID where we're displaying - normally info or output
 * @param {boolean} append - Whether to append the message or replace existing content.
 */
function displayMessage(message, area_id, append = false) {
  let info_area = document.getElementById(area_id);
  if (!append) {
    info_area.innerHTML = ''; // Clear previous messages
  }
  let p = document.createElement('p');
  p.textContent = message;
  info_area.appendChild(p);
}

/** Loads the file from the same folder this script is in. */
async function retrieveFile(fileName) {
	const file_content = await fetch(fileName).then(response => response.text());
	return file_content;
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
