import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";

const info = <const>{
  name: "plugin-mouse-reading",
  version: version,
  parameters: {
    /** Array that defines the size of the canvas element in pixels. First value is height, second value is width. */
    canvas_size: {
      type: ParameterType.INT,
      array: true,
      default: [240, 500],
    },
    /** Presented text. Each different string in the array will become a separate button. */
    text_lines: {
      type: ParameterType.STRING,
      default: [""],
      array: true,
    },
    /** Diameter of the circular aperture,
     * width of the elliptical/rectangular/rounded rectangular aperture (unblurred view).
     * If aperture_gradient is specified,
     * the aperture_width corresponds to the distance to the midpoint (50% sharp view, 50% blurred view).
     * The "full", 100%-sharp view is smaller by 2 * aperture_gradient
     * (aperture_gradient on both sides).
     * The "partial", 0%-sharp view is larger by 2 * aperture_gradient
     * (aperture_gradient on both sides). */
    aperture_width: {
      type: ParameterType.INT,
      default: 60,
    },
    /** Height of the elliptical/rectangular/rounded rectangular aperture (unblurred view).
     * Default value (null) means the value of aperture_width will be used, resulting in a square shape. */
    aperture_height: {
      type: ParameterType.INT,
      default: null,
    },
    /** Radius of the corners in rounded rectangular aperture in pixels.
     * Default value (null) means the radius will be a half of height or width whichever is smaller. */
    aperture_corner_radius: {
      type: ParameterType.INT,
      default: null,
    },
    /** Shape of the aperture. Possible values: "circular", "rectangular", "roundrectangular", "elliptical". */
    aperture_shape: {
      type: ParameterType.STRING,
      default: "circular",
    },
    /** Size of the gaussian gradient in pixels.
     * The distance from full sharp view to full blurred view is 2 * aperture_blur. */
    aperture_blur: {
      type: ParameterType.INT,
      default: 0,
    },
    /** Font family for the text */
    font_family: {
      type: ParameterType.STRING,
      default: "monospace",
    },
    /** Font size for the text */
    font_size: {
      type: ParameterType.STRING,
      default: "24px",
    },
    /** Font weight for the text */
    font_weight: {
      type: ParameterType.STRING,
      default: "normal",
    },
    /** Font colour for the text, e.g. "black", "#4A90E2" or "rgb(74,144,226)" */
    font_colour: {
      type: ParameterType.STRING,
      default: "black",
    },
    /** Vertical distance between text baselines in pixels. */
    line_height: {
      type: ParameterType.INT,
      default: 32,
    },
    /** Text rendering option, one of "auto", "optimizeSpeed", "optimizeLegibility", "geometricPrecision" */
    text_rendering: {
      type: ParameterType.STRING,
      default: "auto",
    },
    /** Blur extent of the stimulus text in pixels. */
    text_blur: {
      type: ParameterType.INT,
      default: 6,
    },
    /** Coordinates of the text baseline in the format of [offsetX, offsetY]. */
    text_offset: {
      type: ParameterType.INT,
      array: true,
      default: [20, 30],
    },
    /** Offset of the button center relative to the text baseline (text_offset).
     * Positive values represent shift left and up. */
    button_offset: {
      type: ParameterType.INT,
      array: true,
      default: [10, 10],
    },
    /** Button diameter in pixels. */
    button_size: {
      type: ParameterType.INT,
      default: 20,
    },
    /** Distance from the button center in pixels when cursor becomes visible. */
    cursor_distance: {
      type: ParameterType.INT,
      default: 20,
    },
    /** Debugging option to display word boundaries in the sharp view. */
    show_segmentation: {
      type: ParameterType.BOOL,
      default: false,
    },
    /** If true, image data in PNG format are returned for later analysis. */
    store_image_data: {
      type: ParameterType.BOOL,
      default: true,
    },
    /** Canvas colour */
    canvas_colour: {
      type: ParameterType.STRING,
      default: "white",
    },
  },
  data: {
    /** The time when the start button was clicked, in milliseconds. */
    start_time: {
      type: ParameterType.FLOAT,
    },
    /** The time when the stop button was clicked, in milliseconds.
     * The time is relative to the start time, i.e. zero means stop button was clicked immediately after start button.*/
    finish_time: {
      type: ParameterType.FLOAT,
    },
    /** Array of mouse events. Times are relative to the start time (start button clicked). */
    mouse_data: {
      type: ParameterType.OBJECT,
    },
    /** Array of array of word coordinates. The top-level array corresponds to the text line, each array element on the second level correspons to one word.
     * The coordinates are relative to the canvas, i.e. same as the mouse data. */
    word_boxes: {
      type: ParameterType.OBJECT,
    },
    /** Provide a clear description of the data2 that could be used as documentation. We will eventually use these comments to automatically build documentation and produce metadata. */
    rendered_text: {
      type: ParameterType.STRING,
    },
    /** Start button coordinates */
    start_button: {
      type: ParameterType.FLOAT,
      array: true,
    },
    /** Stop button coordinates */
    stop_button: {
      type: ParameterType.FLOAT,
      array: true,
    },
    /** The average frame rate for the trial, in ms. */
    frame_rate: {
      type: ParameterType.FLOAT,
    },
    /** The array of frame times in ms for the trial. */
    frame_rate_array: {
      type: ParameterType.INT,
      array: true,
    },
    /** The number of frames in the trial. */
    number_of_frames: {
      type: ParameterType.INT,
    },
  },
  // When you run build on your plugin, citations will be generated here based on the information in the CITATION.cff file.
  citations: "__CITATIONS__",
};

type Info = typeof info;

/**
 * **plugin-mouse-reading**
 *
 * Mouse tracking for reading experiments
 *
 * @author Jiri Lukavsky
 * @see {@link https://github.com/jspsych/jspsych-contrib/packages/plugin-mouse-reading/README.md}}
 */
class MouseReadingPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    // data saving
    var trial_data = {
      data1: 99, // Make sure this type and name matches the information for data1 in the data object contained within the info const.
      data2: "hello world!", // Make sure this type and name matches the information for data2 in the data object contained within the info const.
    };
    // end trial
    this.jsPsych.finishTrial(trial_data);
  }
}

export default MouseReadingPlugin;
