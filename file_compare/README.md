# File Comparison Problem

## Current Status

First commit - most code is currently left over from copying the journaling and dropfile problem types.

## Overview

This problem compares submitted files to a particular set of files in the `/static/` folder, or to a set of sha256 hashes.

### Grading

- Turn partial credit on or off in the `options` variable. If partial credit is off, only 100% correctness receives credit.
- If we're using hashes, the score returned is the percentage of files whose hashes match exactly.
- If we're using files, each file can get partial credit. Perfect matches give full credit, but if things differ in the ways listed below, partial credit can be obtained. Partial credit values are multiplied together to get the final score.
  - `blank_lines` is applied if there are extra blank lines.
  - `case` is applied if things match only once case is squished.
  - `encoding` is applied if the file is in `utf-8` when it should be in `ansi` (Windows) or vice versa. Those are the only two encodings we accept.
  - `spaces` is applied if whitespace at beginning and end of lines does not match.
  - To make one of these items *required*, set it to 0 so that it will zero out the score on its own. To *ignore* it, set it to 1 so that missing that item doesn't alter the score.
  - Scores below the `low_cutoff` are rounded down to 0%.
  - Scores above the `high_cutoff` are rounded up to 100%.
  - Minimum score is `participation points`.

## Creating Your Own File Comparison Problems

1. Get the `python_lib.zip` file from [HX-PY](https://github.com/Colin-Fredericks/hx-py) and upload it to your Files page. *Keep it zipped.*
2. Download `jschannel.js`, `file_comparison.html` and `file_comparison.js`, and upload them to your Files page.
3. Download `file_comparison.xml`, edit the prompt as desired, and paste that into a Blank Advanced Problem.
4. Adjust the python in your problem to include either the filenames for comparison or the hashes you want to compare to.

## Notes

- You can create multiple File Comparison problems on the same page.
- The hashing algorithm used is **SHA-256**. If you call your algorithm on the string `test` and you get `9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08` back, you are probably using the right algorithm.

## Files

Inside you will find many pieces used to create this problem:

- `jschannel.js`: the javascript file that allows javascript-type problems to work at all. You should not need to change this. I didn't make this one.
- `file_comparison.js`: the javascript file that does the majority of the work. You should not need to change this.
- `file_comparison.html`: the HTML file that will be iframed into the page. You should not need to change this.
- `file_comparison.xml`: the XML used to create the problem within Studio. You will need to make changes to this, replacing the prompt with your own and listing filenames or hashes as mentioned above.
