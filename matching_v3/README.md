### Matching v3 ###

#### Notes ####
This is a work-in-progress for an improved version of the Accessible Matching problem. Goals: improved accessibility and ease of implementation.


#### Overview ####
This implements a standard matching exercise of the "draw the lines to match things on the left with things on the right" sort. It handles both text and images, and does one-to-one and many-to-many matching. The correct answer is hidden from students via python in the problem XML. Keyboard users can accomplish the matching task without needing to use the mouse.

Student state is recorded via Logger.log() when a grade is calculated, but not at other times.

#### Creating Your Own Matching Problems ####

Here's how to adapt this example to create your own matching problems.

1. Come up with the items.
2. Find images or write text (full HTML ok) for the matching items. 
  * Consider front-loading the text of your items so that students hear the most important or identifiable parts of them first when using a screen reader. 
  * Consider making the items on the right-hand side the shorter ones. Learners will read through that list multiple times.
3. Download the files used in this problem.
4. Update the Matching_Name.yaml file. Rename it to match your problem. Fill in the 'type' property with either 'text' or 'image', and fill in the according property with the image's filename or with your text. The text field is used as alt text for images.
5. Upload all your images and files to the "Files and Uploads" section of Studio, or just dump them in the proper directory if you're using the XML approach.
6. Create a new Custom Javascript Display and Input problem. Copy and paste the contents of Matching_v3.xml into that problem. Change the link in the python so that it points to the right Matching_Name.yaml file. Fix up the `right\_answer` variable so that it contains the answer you want, and add your own instructions for the students.
7. Use your browser's javascript console for debugging - for instance, if your items' text or images aren't showing up, it may point you to the line in your MatchingMA\_Elements.js file that is causing the problem.

##### Using Multiple Matching Problems #####

If you have multiple matching problems in your course, you need to have different Matching_Name files for each one, each with their own names.

Never put two matching problems on the same page. The universe will explode. Or maybe they just won't work. Probably the second one. No guarantees.

#### Files: ####

Inside you will find many pieces used to create this problem:

- `jschannel.js`: the javascript file that allows javascript-type problems to work at all. You should not need to change this. I didn't make this one.
- `underscore.js`: This does some nice array equality checking for us, and some minor other stuff. You should not need to change this. I didn't make this one.
- `jquery.ui.touch-punch.min.js`: [Touch Punch](https://github.com/furf/jquery-ui-touch-punch), an awesome JQuery extension that maps touch events into mouse events. Used for mobile compatibility. Should not need to alter.
- `MatchingMA.js`: the javascript file that does the majority of the work and allows you to drag items around and stuff. You should not need to change this.
- `MatchingMA.css`: the css file that makes things look pretty (or as close as I could get them). You should not need to change this.
- `MatchingMA.html`: the HTML file that will be iframed into the page. You should not need to change this unless you have more than one matching problem in your course.
- `MatchingMA.xml`: the XML used to create the problem within Studio. You will need to make changes to this: updating `right\_answer` to be the actual right answer you want, and filling it with your own instruction text.
- `MatchingMA\_Elements.js`: holds the pregenerated group names. You will need to update this to have the items you want.
- And several image files that you will need to replace with your own.

When creating your own matching problem, you will upload almost every file in this directory to the Files and Uploads section. There are two exceptions: the XML file (which you cut-and-paste into Studio) and the image files (which you replace with your own).
