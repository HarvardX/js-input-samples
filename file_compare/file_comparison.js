"use strict";
console.log("File Comparison problem ready");

// If the student comes to this problem for the first time,
// they start blank.
var JSProblemState = {
  filenames: [],
  message: "",
  credits: [],
  final_credit: 0,
};

// We only get one shot at this, the first time the problem loads.
// *Should* it be available later? Yes. Is it? No.
window.parent.hx_file_comparison_options = getOptions();
console.log(window.parent.hx_file_comparison_options);

// This wrapper function is necessary.
// You can rename it if you want, just make sure the attributes
// in your <jsinput> tag match the function name here.
var file_comparison = (function () {
  // REQUIRED --- DO NOT REMOVE/CHANGE!!
  var channel;

  // REQUIRED --- DO NOT REMOVE/CHANGE!!
  // Channel.js sets up a way for the problem to pass information back to edX.
  if (window.parent !== window) {
    channel = Channel.build({
      window: window.parent,
      origin: "*",
      scope: "JSInput",
    });
    channel.bind("getGrade", getGrade);
    channel.bind("getState", getState);
    channel.bind("setState", setState);
  }

  // Called by edX to obtain the current learner state for this problem.
  function getState() {
    console.log("getting state");
    // This string gets URI-decoded later, so percents need to be escaped.
    // Assuming no percents in filenames or credit amounts (those are decimals).
    JSProblemState.message = JSProblemState.message.replace(/%/g, "%25");
    // Give edX our state as a string.
    return JSON.stringify(JSProblemState);
  }

  // Called by edX to set the live learner state to what's recorded on the server.
  function setState() {
    console.log("setting state");
    // Make sure we're getting the right thing from edX.
    let stateStr = arguments.length === 1 ? arguments[0] : arguments[1];
    // edX stores the state as stringified JSON. Parse it.
    JSProblemState = JSON.parse(stateStr);
    JSProblemState.message = JSProblemState.message.replace(/%25/g, "%");
    // Set the live state to the stored state (the learner's previous answer).
    displayMessage(JSProblemState.message, "hx-output-area", true);
  }

  // Called by edX when the learner submits the problem.
  function getGrade() {
    console.log("getting grade");
    // The answer string gets URI-decoded later, so percents need to be escaped.
    // Assuming no percents in filenames or credit amounts (those are decimals).
    JSProblemState.message = JSProblemState.message.replace(/%/g, "%25");

    // Send the problem state to be graded.
    return JSON.stringify(JSProblemState);
  }

  // REQUIRED --- DO NOT REMOVE/CHANGE!!
  // These make the above functions public so that edX can call them.
  return {
    getState: getState,
    setState: setState,
    getGrade: getGrade,
  };
})();

// Let's go.
init("edx");

/** Create the file drop area and set up listeners. No return value. */
async function init(environment) {
  let d = window.parent.document; // We do everything in the parent.
  let all_file_content = {};
  let options = window.parent.hx_file_comparison_options;

  displayMessage(
    "Required files: " + options.filenames.join(", "),
    "hx-prompt-area",
    false,
  );

  // Create a file-drop area for processing.
  const fileDropArea = d.getElementById("hx-file-drop-area");
  // Add event listeners for drag and drop functionality.
  fileDropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    fileDropArea.classList.add("hx-dragover");
  });

  fileDropArea.addEventListener("dragleave", (event) => {
    event.preventDefault();
    fileDropArea.classList.remove("hx-dragover");
  });

  fileDropArea.addEventListener("drop", async (event) => {
    event.preventDefault();
    fileDropArea.classList.remove("hx-dragover");
    const files = event.dataTransfer.files;
    all_file_content = await readFiles(files, options);
    compareFiles(all_file_content, options, environment);
  });

  // Let people click on the area to open a file dialog
  // in case they can't drag.
  fileDropArea.addEventListener("click", () => {
    const fileInput = d.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true; // Allow multiple files to be selected.
    fileInput.addEventListener("change", async (event) => {
      const files = event.target.files;
      all_file_content = await readFiles(files);
      compareFiles(all_file_content, options, environment);
    });
    fileInput.click();
  });
}

/** Read off the options defined in the python part of the XML. */
function getOptions() {
  if (window.parent.hx_file_comparison_options) {
    return window.parent.hx_file_comparison_options;
  }
  let d = window.parent.document; // We do everything in the parent.
  let all_file_content = {};

  // Options are set in the XML.
  // It does odd things with single/double quotes, thus the stringify/parse combo.
  const options_holder = d.getElementById("hx-file-comparison-options");
  let tc = options_holder.textContent.trim();
  if (typeof tc === "undefined" || tc === null || tc === "None" || tc === "") {
    tc = "{}";
  }
  // Replace single quotes with double quotes and vice versa
  // Sort of relying on Æ will not be in the string.
  tc = tc.replace(/'/g, "Æ").replace(/"/g, "'").replace(/Æ/g, '"');
  console.log(tc);
  let options = JSON.parse(tc);
  console.log("Options:");
  console.log(options);

  return options;
}

/**
 * Reads in the learner files and returns most of the info as an object.
 *
 * @param {FileList} files - The list of files uploaded by the learner.
 *
 * @returns {Promise<Object>} An object containing the file information.
 */
async function readFiles(files) {
  let all_file_content = {};
  for (const f of files) {
    const reader = new FileReader();
    await new Promise((resolve, reject) => {
      reader.onload = (event) => {
        const file_content = event.target.result;
        // console.log(f);
        all_file_content[f.name] = {
          content: file_content,
          size: f.size,
          type: f.type,
        };
        resolve();
      };
      reader.onerror = (event) => {
        reject(event.target.error);
      };
      reader.readAsText(f);
    });
  }
  return Promise.resolve(all_file_content);
}

/**
 * Compares file content uploaded by learners to the correct answers.
 * Returns score and comments.
 * @param {Object} all_file_content
 * @param {Object} options
 * @param {String} environment
 */
async function compareFiles(all_file_content, options, environment) {
  if (Object.keys(all_file_content).length !== options.filenames.length) {
    console.error("Did not upload all files.");
    displayMessage(
      "You uploaded " +
        Object.keys(all_file_content).length +
        " out of " +
        options.filenames.length +
        " required files. Please upload the required files.",
      "hx-output-area",
      false,
    );
    return;
  }

  let required_files = options.filenames.slice(); // Make a copy of the required filenames
  let max_credit = Object.keys(all_file_content).length;
  let current_credit = 0;
  let missing_required_word = options.must_have.map((x) => true); // Start with all required words missing
  let message = ""; // Will be reported to learner

  for (const filename in all_file_content) {
    const f = all_file_content[filename];
    f.name = filename;

    // Is this a file we wanted?
    if (!options.filenames.includes(f.name)) {
      console.error("Unexpected file: " + f.name);
      displayMessage(
        "Unexpected file: " + f.name + ". Please upload the required files.",
        "hx-output-area",
        true,
      );
      continue;
    } else {
      // Remove from list so we can keep track of which files have been processed.
      let index = required_files.indexOf(f.name);
      if (index > -1) {
        required_files.splice(index, 1);
      }
    }

    let this_file_credit = 1;
    let apply_partial_credit = {
      blank_lines: false,
      case: false,
      spaces: false,
    };

    if (
      !f.type.includes("text") &&
      !f.type.includes("json") &&
      !f.type.includes("javascript") &&
      !f.type.includes("python")
    ) {
      // This is not a text file.
      let outputArea = window.parent.document.querySelector("#hx-output-area");
      outputArea.innerHTML +=
        "<p>" + f.name + " is of type " + f.type + ", not a text file.</p>";
    } else {
      // Yay it's a text file!
      displayMessage("Filename: " + f.name, "hx-output-area", true);

      // Go get the file to compare to.
      let correct_file_content = await retrieveFile(
        f.name,
        options.test_file_source || "",
        environment,
      );

      // Using hashes if you want to avoid revealing the correct answer
      if (options.files_or_hashes === "hashes") {
        // Hash the submitted file's content.
        let submitted_file_hash = await sha256(f.content);
        let msg = "";
        if (options.hashes[filename] === submitted_file_hash) {
          msg = "Hashes match for " + f.name + ".\n";
          missing_required_word = missing_required_word.map((x) => false); // All required words are present if the hash matches.
        } else {
          msg =
            "Hashes do not match for " +
            f.name +
            ". No credit for this file.\n";
          this_file_credit = 0;
        }
        current_credit += this_file_credit;

        console.log(msg);
        message += msg;
        continue;
      }

      // Just for reference, these are the keys for the `credit_options` object. All are Numbers.
      //   blank_lines
      //   case
      //   spaces
      //   low_cutoff
      //   high_cutoff
      //   participation_points

      let submitted_file_content = f.content;
      let correct_file_by_line = correct_file_content.split("\n");
      let submitted_file_by_line = submitted_file_content.split("\n");

      // Compare the two files line by line.
      // let offset = 0;
      let matches_by_line = [];
      for (let i = 0; i < correct_file_by_line.length; i++) {
        let correct_line_is_blank = correct_file_by_line[i].trim() === "";
        let submitted_line_is_blank = submitted_file_by_line[i].trim() === "";

        // If one of the prohibited words is present, stop now. Zero credit.
        for (const prohibited_word of options.cannot_have) {
          if (submitted_file_by_line[i].includes(prohibited_word)) {
            console.log("Prohibited word found: " + prohibited_word);
            message +=
              "Prohibited word found: " +
              prohibited_word +
              ". No credit for this file.\n";
            this_file_credit = 0;
            break;
          }
        }
        // Make sure we have all the required words eventually.
        for (let j = 0; j < options.must_have.length; j++) {
          const required_word = options.must_have[j];
          if (submitted_file_by_line[i].includes(required_word)) {
            missing_required_word[j] = false;
          }
        }

        if (i >= submitted_file_by_line.length) {
          console.log("Ran out of lines in submitted file.");
          message += f.name + " is too short. No credit for this file.\n";
          break;
        }

        if (correct_file_by_line[i] === submitted_file_by_line[i]) {
          // Perfect match, everything's great.
          matches_by_line.push(true);
          continue;
        }

        // If there's an identical blank line in both files, we're good, but that's already covered above.
        // If there are *non-identical* blank lines in both files, we can still give partial credit for that.
        if (correct_line_is_blank && submitted_line_is_blank) {
          if (correct_file_by_line[i] !== submitted_file_by_line[i]) {
            // Identical blank lines except whitespace.
            console.log("Non-matching blanks at " + (i + 1) + ".\n");
            apply_partial_credit.spaces = true;
          }
          continue;
        }
        // If there's a blank line in one file but not the other, remove it and continue.
        if (correct_line_is_blank || submitted_line_is_blank) {
          console.log("Blank line mismatch at line " + (i + 1) + ".\n");
          if (correct_line_is_blank) {
            correct_file_by_line.splice(i, 1);
          } else {
            submitted_file_by_line.splice(i, 1);
            i--;
          }
          apply_partial_credit.blank_lines = true;
          if (correct_file_by_line[i] !== submitted_file_by_line[i]) {
            // Identical blank lines except whitespace.
            apply_partial_credit.spaces = true;
          }
          continue;
        }

        // Imperfect match, check for partial credit.
        if (
          matchesWithoutCase(correct_file_by_line[i], submitted_file_by_line[i])
        ) {
          console.log("Line " + (i + 1) + " is the same except for case.");
          apply_partial_credit.case = true;
        } else if (
          matchesWithoutWhitespace(
            correct_file_by_line[i],
            submitted_file_by_line[i],
          )
        ) {
          console.log(
            "Line " +
              (i + 1) +
              " matches except for whitespace at start or end.",
          );
          apply_partial_credit.spaces = true;
        } else if (
          matchesWithoutCaseAndWhitespace(
            correct_file_by_line[i],
            submitted_file_by_line[i],
          )
        ) {
          console.log(
            "Line " +
              (i + 1) +
              " matches except for case and whitespace at start or end.",
          );
          apply_partial_credit.case = true;
          apply_partial_credit.spaces = true;
        } else {
          console.log(
            "Line " + (i + 1) + " is entirely different. Done comparing.",
          );
          message +=
            "Line " +
            (i + 1) +
            " is entirely different in input file. No credit for this file.\n";
          this_file_credit = 0;
          break;
        }
      }
    }

    for (const key in apply_partial_credit) {
      if (apply_partial_credit[key]) {
        console.log("Partial credit applied for " + key);
        this_file_credit *= options.credit_options[key];
      }
    }
    if (missing_required_word.includes(true)) {
      console.log("Missing required word(s) in " + f.name);
      this_file_credit = 0;
    }

    // If we're not applying any partial credit, this is a perfect match.
    // Otherwise, explain why.
    let applying_partial_credit = Object.values(apply_partial_credit).some(
      (x) => x === true,
    );
    if (!applying_partial_credit && this_file_credit === 1) {
      message += "Perfect match for " + f.name + ".\n";
    } else {
      if (this_file_credit > 0) {
        message += "Partial match for " + f.name + ".\n";
        message += partialCreditMessage(options, apply_partial_credit);
      } else {
        message += "Insufficient match for " + f.name + ".\n";
      }
    }

    this_file_credit = Math.round(this_file_credit * 100) / 100; // Round to two decimal places
    current_credit += this_file_credit;
    console.log(
      "Credit for " + f.name + ": " + decimalToPercentage(this_file_credit),
    );
    JSProblemState.filenames.push(f.name);
    JSProblemState.credits.push(this_file_credit);
  }

  /**********************************
  Final credit calculation section
  **********************************/
  let credit = current_credit / max_credit;
  let msg = "";
  if (credit < options.credit_options.low_cutoff) {
    credit = 0;
    msg =
      "Credit is below " +
      decimalToPercentage(options.credit_options.low_cutoff) +
      ". No credit awarded.\n";
    message += msg;
    console.log(msg);
  }
  if (credit + options.credit_options.participation_points <= 1) {
    credit += options.credit_options.participation_points;
    msg =
      "Adding participation points: +" +
      decimalToPercentage(options.credit_options.participation_points) +
      "\n";
    message += msg;
    console.log(msg);
  }
  if (credit > options.credit_options.high_cutoff && credit < 1) {
    credit = 1;
    msg =
      "Credit is above " +
      decimalToPercentage(options.credit_options.high_cutoff) +
      ". Rounding up to full credit.\n";
    message += msg;
    console.log(msg);
  }
  console.log("Final credit: " + decimalToPercentage(credit));
  message += "Final credit: " + decimalToPercentage(credit) + "\n";
  JSProblemState.final_credit = credit;
  JSProblemState.message = message;
  displayMessage(message, "hx-output-area", true);
  // Send it back or save the state or whatever.
}

/** Check for whitespace mismatch */
function matchesWithoutWhitespace(str1, str2) {
  // Remove leading and trailing whitespace from both strings
  const trimmedStr1 = str1.trim();
  const trimmedStr2 = str2.trim();

  // Compare the trimmed strings
  return trimmedStr1 === trimmedStr2;
}

/** Check if two strings match regardless of case */
function matchesWithoutCase(str1, str2) {
  return str1.toLowerCase() === str2.toLowerCase();
}

/** Does both case and whitespace */
function matchesWithoutCaseAndWhitespace(str1, str2) {
  // Remove leading and trailing whitespace from both strings
  const trimmedStr1 = str1.trim();
  const trimmedStr2 = str2.trim();

  // Compare the trimmed strings in lowercase
  return trimmedStr1.toLowerCase() === trimmedStr2.toLowerCase();
}

/** Assembles the message for partial credit (per file) */
function partialCreditMessage(options, apply_partial_credit) {
  let message = "";

  if (options.credit_options.spaces < 1 && apply_partial_credit.spaces) {
    message +=
      "Partial credit for excess whitespace: x" +
      decimalToPercentage(options.credit_options.spaces) +
      "\n";
  }
  if (options.credit_options.case < 1 && apply_partial_credit.case) {
    message +=
      "Partial credit for upper/lower case mismatch: x" +
      decimalToPercentage(options.credit_options.case) +
      "\n";
  }
  if (
    options.credit_options.blank_lines < 1 &&
    apply_partial_credit.blank_lines
  ) {
    message +=
      "Partial credit for extra blank lines: x" +
      decimalToPercentage(options.credit_options.blank_lines) +
      "\n";
  }

  return message;
}

/**
 * Displays a message in the specified area.
 * @param {String} message - The message to display.
 * @param {String} area_id - The ID where we're displaying - normally info or output
 * @param {Boolean} append - Whether to append the message or replace existing content.
 */
function displayMessage(message, area_id, append = false) {
  let info_area = window.parent.document.getElementById(area_id);
  if (!append) {
    info_area.innerHTML = ""; // Clear previous messages
  }
  let p = document.createElement("p");
  message = message.replace(/\n/g, "<br>"); // Replace newlines with <br> for HTML display
  p.innerHTML = message;
  info_area.appendChild(p);
}

/**
 * Turns a decimal number or string to a percentage string.
 * @param {Number|String} decimal - The decimal number to convert.
 * @param {Number} n - The number of decimal places to include in the percentage.
 * @returns {String} The percentage string.
 */
function decimalToPercentage(decimal, n = 0) {
  decimal = parseFloat(decimal);
  return (decimal * 100).toFixed(n) + "%";
}

/**
 * Loads the file from the listed folder. Folder can be a fully qualified URL.
 *
 * @param {String} file_name - The name of the file to retrieve.
 * @param {String} environment - The environment (edx in this iteration) because they all work differently.
 * @returns {Promise<string>} The content of the file as a string.
 */
async function retrieveFile(file_name, folder_name, environment) {
  folder_name = folder_name.replace(/^\/|\/$/g, ""); // Remove leading and trailing slashes
  let file_url = "";
  if (environment === "edx") {
    file_url = getEdxFileURL(file_name);
  } else {
    // Assume localhost or other environment
    file_url = window.location.origin + "/" + folder_name + "/" + file_name;
  }
  const file_content = await fetch(file_url).then((response) =>
    response.text(),
  );
  return file_content;
}

/**
 * Gets asset URLs for edX
 *
 * @param {String} filename - The name of the file to retrieve.
 * @returns {String} The fully qualified URL for the asset file.
 */
function getEdxFileURL(filename) {
  let windowURL = window.location.href;
  console.log(filename);

  // Sometimes escape characters are not our friends.
  // Replace + and : if they're present.
  if (windowURL.includes("%2B")) {
    windowURL = windowURL.replace("%2B", "+");
  }
  if (windowURL.includes("%3A")) {
    windowURL = windowURL.replace("%3A", ":");
  }

  // Regex for asset-v\d:HarvardX+(.+?)+\dT\d\d\d\d
  let assetRegex = /-v\d:(.+?)\+(.+?)\+\dT\d\d\d\d/;
  // Capture the course identifier from the URL
  console.log("Window URL: " + windowURL);
  let match = windowURL.match(assetRegex);
  let courseIdentifier = "";
  if (match) {
    courseIdentifier = match[0];
    console.log("Course identifier: " + courseIdentifier);
  } else {
    console.error("Could not extract course identifier from URL.");
  }

  let staticFileURL =
    "https://courses.edx.org/" +
    "asset" +
    courseIdentifier +
    "+type@asset+block/" +
    filename;

  return staticFileURL;
}

/**
 * Hashes text to SHA256 for the purpose of comparing answers without revealing the answer itself.
 * Taken from https://stackoverflow.com/a/70243259/1330737
 *
 * @param {String} source
 * @returns {Promise<string>}
 */
async function sha256(source) {
  const sourceBytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", sourceBytes);
  const resultBytes = [...new Uint8Array(digest)];
  const hash = resultBytes.map((x) => x.toString(16).padStart(2, "0")).join("");
  console.log("SHA256 hash: " + hash);
  return hash;
}
