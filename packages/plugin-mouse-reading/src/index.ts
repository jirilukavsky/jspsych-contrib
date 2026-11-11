import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

import { version } from "../package.json";
import {
  WordBox,
  canvasMousePos,
  createSimulatedMouseDataAlongLine,
  findWordBoundaries,
  saveCanvas,
  wordCoordinates,
} from "./utils";

function textFontFromProperties(itrial: TrialType<Info>): string {
  return `${itrial.font_weight} ${itrial.font_size} ${itrial.font_family}`;
}

const info = <const>{
  name: "plugin-mouse-reading",
  version: version,
  parameters: {
    /** Array that defines the size of the canvas element in pixels.
     * First value is height, second value is width. */
    canvas_size: {
      type: ParameterType.INT,
      array: true,
      default: [240, 500],
    },
    /** Presented text. Each string in the array will become a separate line of text. */
    text_lines: {
      type: ParameterType.STRING,
      default: [""],
      array: true,
    },
    /** Diameter of the circular aperture,
     * width of the elliptical/rectangular/rounded rectangular aperture (unblurred view).
     * If aperture_blur is specified,
     * the aperture_width corresponds to the distance to the midpoint (50% sharp view, 50% blurred view).
     * The "full", 100%-sharp view is smaller by 2 * aperture_blur
     * (aperture_blur on both sides).
     * The "partial", 0%-sharp view is larger by 2 * aperture_blur
     * (aperture_blur on both sides). */
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
      type: ParameterType.SELECT,
      options: ["circular", "rectangular", "roundrectangular", "elliptical"],
      default: "circular",
    },
    /** Size of the gaussian gradient in pixels.
     * The distance from full sharp view to full blurred view is 2 * aperture_blur. */
    aperture_blur: {
      type: ParameterType.INT,
      default: 0,
    },
    /** Font family for the text.
     * It is mixed together with other font properties
     * `${font_weight} ${font_size} ${font_family}`
     * into a single font CSS property
     * https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font
     */
    font_family: {
      type: ParameterType.STRING,
      default: "monospace",
    },
    /** Font size for the text
     * It is mixed together with other font properties
     * `${font_weight} ${font_size} ${font_family}`
     * into a single font CSS property
     * https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font
     */
    font_size: {
      type: ParameterType.STRING,
      default: "24px",
    },
    /** Font weight for the text
     * It is mixed together with other font properties
     * `${font_weight} ${font_size} ${font_family}`
     * into a single font CSS property
     * https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font
     */
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
    /** Offset of the button centers, with 2 or 4 elements
     * ([offsetX, offsetY] is values are shared for start and stop buttons,
     * or [startOffsetX, startOffsetY, stopOffsetX, stopOffsetY]
     * if you want to specify different values for each button.
     * The offset values are
     * relative to the text baseline (text_offset).
     * Positive X-values represent shift away from the text
     * (left for start button, right for stop button).
     * Positive Y-values represent shifts up. */
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
      default: false,
    },
    /** Canvas colour */
    canvas_colour: {
      type: ParameterType.STRING,
      default: "white",
    },
    /** Aperture colour */
    aperture_colour: {
      type: ParameterType.STRING,
      default: "white",
    },
  },
  data: {
    /** The time when the start button was clicked, in milliseconds. */
    start_time: {
      type: ParameterType.FLOAT,
    },
    /** The time between the start and stop buttons were clicked, in milliseconds,
     * i.e. zero means stop button was clicked immediately after start button.*/
    reading_time: {
      type: ParameterType.FLOAT,
    },
    /** Array of mouse events. Times are relative to the start_time (start button clicked). */
    mouse_data: {
      type: ParameterType.OBJECT,
    },
    /** Array of array of word coordinates. The top-level array corresponds to the text line, each array element on the second level corresponds to one word.
     * The coordinates are relative to the canvas, i.e. same as the mouse data. */
    word_boxes: {
      type: ParameterType.OBJECT,
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
    /** Optional Data URL text with the PNG of the rendered text */
    image_data: {
      type: ParameterType.STRING,
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
    // checks ------------------------------------------------------------
    // value checks
    if (trial.aperture_blur < 0) {
      throw new Error("The aperture_blur cannot be negative.");
    }
    if (trial.text_lines.length == 0) {
      throw new Error("The text_lines cannot be empty array.");
    }
    if (trial.text_lines[0].length == 0) {
      throw new Error("The text_lines values cannot be empty text.");
    }
    if (trial.canvas_size.length != 2) {
      throw new Error("The canvas_size must have two elements: [height, width]");
    }
    if (trial.button_offset.length != 2 && trial.button_offset.length != 4) {
      throw new Error("The button_offset should have 2 or 4 elements.");
    }

    // parameters, variables, data ---------------------------------------
    // aperture
    let redraw = true;
    const apertureWidth = trial.aperture_width;
    const apertureHeight = trial.aperture_height ?? trial.aperture_width;
    const textBlur = trial.text_blur;
    const apertureBlur = trial.aperture_blur;
    const apertureCornerRadius =
      trial.aperture_corner_radius ?? Math.min(apertureHeight, apertureWidth) / 2;
    let lastX = -apertureWidth,
      lastY = -apertureHeight;
    // canvas size
    const canvasHeight = trial.canvas_size[0];
    const canvasWidth = trial.canvas_size[1];
    const canvasColour = trial.canvas_colour;
    const apertureColour = trial.aperture_colour;
    // mask size
    const maskWidth = apertureWidth + apertureBlur * 2;
    const maskHeight = apertureHeight + apertureBlur * 2;
    const maskShape = trial.aperture_shape;
    // text position
    const textOffsetX = trial.text_offset[0];
    const textOffsetY = trial.text_offset[1];
    let textFont = textFontFromProperties(trial);
    // button placement
    const startOffsetX = trial.button_offset[0];
    const startOffsetY = trial.button_offset[1];
    const stopOffsetX =
      trial.button_offset.length == 2 ? trial.button_offset[0] : trial.button_offset[2];
    const stopOffsetY =
      trial.button_offset.length == 2 ? trial.button_offset[1] : trial.button_offset[3];
    const buttonRadius = trial.button_size / 2;
    const cursorDistance = trial.cursor_distance;
    const startButtonX = textOffsetX - startOffsetX;
    const startButtonY = textOffsetY - startOffsetY;
    let stopButtonX = 0;
    let stopButtonY = 0;

    // clicks
    let activeButtonX = -1;
    let activeButtonY = -1;
    let activeButtonRadius = buttonRadius;
    let waitingForStart = true;
    const hideCursor = true;
    // other data
    let frameRequestID: number;
    let mouseData = [];
    let jsPsych = this.jsPsych;
    let wordBoxes = [];
    const showSegmentation = trial.show_segmentation;
    const storeImageData = trial.store_image_data;
    let imageData = "";
    let startTime: number; // clicked Start, as performance.now()
    let timeZero: number; // start of the trial, as performance.now()

    // Create canvas
    const stimulusElement = document.createElement("div");
    stimulusElement.id = "jspsych-mouse-reading-stimulus";

    const canvasShown = document.createElement("canvas");
    canvasShown.id = "jspsych-canvas-stimulus";
    canvasShown.height = canvasHeight;
    canvasShown.width = canvasWidth;
    canvasShown.style.display = "block";

    const canvasBlur = document.createElement("canvas");
    canvasBlur.height = canvasHeight;
    canvasBlur.width = canvasWidth;

    const canvasSharp = document.createElement("canvas");
    canvasSharp.height = canvasHeight;
    canvasSharp.width = canvasWidth;

    const canvasMask = document.createElement("canvas");
    canvasMask.height = maskHeight;
    canvasMask.width = maskWidth;

    const canvasTemporary = document.createElement("canvas");
    canvasTemporary.height = maskHeight;
    canvasTemporary.width = maskWidth;

    stimulusElement.appendChild(canvasShown);
    display_element.appendChild(stimulusElement);

    let ctxShown = canvasShown.getContext("2d"); // final canvas context
    let ctxBlur = canvasBlur.getContext("2d"); // blurred
    let ctxSharp = canvasSharp.getContext("2d"); // sharp
    let ctxMask = canvasMask.getContext("2d"); // mask
    let ctxTemporary = canvasTemporary.getContext("2d"); // temporary

    function draw_text(ctx: CanvasRenderingContext2D): void {
      const lineHeight = trial.line_height;
      const lines = trial.text_lines as string[];
      let x = trial.text_offset[0];
      let y = trial.text_offset[1];

      // draw text
      ctx.font = textFontFromProperties(trial);
      ctx.fillStyle = trial.font_colour;
      ctx.textRendering = trial.text_rendering as CanvasTextRendering;

      for (const l of lines) {
        ctx.fillText(l, x, y);
        y += lineHeight;
      }
    }

    function draw_target(
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      radius: number,
      color: string
    ): void {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
    function drawImageUsingMask(
      source: CanvasRenderingContext2D,
      destination: CanvasRenderingContext2D,
      sx: number,
      sy: number
    ): void {
      // Clean the canvas with default colour (and default blending mode)
      ctxTemporary.globalCompositeOperation = "source-over";
      ctxTemporary.fillStyle = canvasColour;
      ctxTemporary.fillRect(0, 0, maskWidth, maskHeight);
      // Take a part of source image of the size of mask,
      // and put it on the canvas
      ctxTemporary.drawImage(
        source.canvas,
        sx - maskWidth / 2,
        sy - maskHeight / 2,
        maskWidth,
        maskHeight,
        0,
        0,
        maskWidth,
        maskHeight
      );

      // Apply the mask on canvas:
      // "destination-in" keeps only the parts of the existing canvas content (the destination)
      // that overlap with the new shape or image you are drawing (the source).
      // Everything else is made transparent.
      ctxTemporary.globalCompositeOperation = "destination-in";
      ctxTemporary.drawImage(canvasMask, 0, 0);

      // Copies the canvas content on the destination
      destination.drawImage(
        ctxTemporary.canvas,
        0,
        0,
        maskWidth,
        maskHeight,
        sx - maskWidth / 2,
        sy - maskHeight / 2,
        maskWidth,
        maskHeight
      );
    }
    function setupGraphics() {
      // draw text blurred
      ctxBlur.globalCompositeOperation = "source-over";
      ctxBlur.fillStyle = canvasColour;
      ctxBlur.fillRect(0, 0, ctxBlur.canvas.width, ctxBlur.canvas.height);
      ctxBlur.filter = `blur(${textBlur}px)`;
      draw_text(ctxBlur);
      // the stop button is also blurred
      draw_target(ctxBlur, stopButtonX, stopButtonY, buttonRadius, "darkred");
      ctxBlur.filter = "none";

      // draw text sharp
      ctxSharp.globalCompositeOperation = "source-over";
      ctxSharp.fillStyle = apertureColour;
      ctxSharp.fillRect(0, 0, ctxSharp.canvas.width, ctxSharp.canvas.height);
      draw_text(ctxSharp);
      draw_target(ctxSharp, stopButtonX, stopButtonY, buttonRadius, "darkred");
      if (showSegmentation) {
        drawWordBoxes(ctxSharp);
      }
      if (storeImageData) {
        imageData = canvasSharp.toDataURL("image/png");
      }
      prepareMaskWithShape(maskShape);
      // saveCanvas(canvasMask, "mask.png");
      // end of drawing
    }
    function prepareMaskWithShape(maskShape: string) {
      ctxMask.fillStyle = "rgba(255,255,255,0)";
      ctxMask.fillRect(0, 0, maskWidth, maskHeight);
      ctxMask.filter = `blur(${apertureBlur}px)`;
      ctxMask.fillStyle = "rgba(255,255,255,1)";

      // draw mask
      switch (maskShape) {
        case "circular":
          ctxMask.beginPath();
          ctxMask.arc(maskWidth / 2, maskHeight / 2, apertureWidth / 2, 0, 2 * Math.PI, false);
          ctxMask.fill();
          break;
        case "rectangular":
          ctxMask.fillRect(apertureBlur, apertureBlur, apertureWidth, apertureHeight);
          break;
        case "roundrectangular":
          ctxMask.beginPath();
          ctxMask.roundRect(
            apertureBlur,
            apertureBlur,
            apertureWidth,
            apertureHeight,
            apertureCornerRadius
          );
          ctxMask.fill();
          break;
        case "elliptical":
          ctxMask.beginPath();
          ctxMask.ellipse(
            maskWidth / 2,
            maskHeight / 2,
            apertureWidth / 2,
            apertureHeight / 2,
            0,
            0,
            2 * Math.PI,
            false
          );
          ctxMask.fill();
          break;
      }

      ctxMask.filter = "none";
      ctxMask.globalCompositeOperation = "source-over";
    }

    function animateMouseMotion(): void {
      frameRequestID = window.requestAnimationFrame(animate);
      function animate() {
        if (redraw) {
          ctxShown.fillStyle = canvasColour;
          ctxShown.fillRect(0, 0, canvasWidth, canvasHeight);
          if (waitingForStart) {
            draw_target(ctxShown, startButtonX, startButtonY, buttonRadius, "green");
          } else {
            ctxShown.drawImage(ctxBlur.canvas, 0, 0);
            drawImageUsingMask(ctxSharp, ctxShown, lastX, lastY);
          }

          redraw = false;
        }
        frameRequestID = window.requestAnimationFrame(animate);
      }
    }
    function drawWordBoxes(ctx: CanvasRenderingContext2D) {
      let boxes = wordBoxes.flat();
      for (let i = 0; i < boxes.length; i++) {
        ctx.strokeStyle = "#FF8888";
        ctx.strokeRect(boxes[i].left, boxes[i].top, boxes[i].width, boxes[i].height);
      }
    }
    function activateStartButton() {
      activeButtonX = startButtonX;
      activeButtonY = startButtonY;
      activeButtonRadius = buttonRadius;
    }
    function activateStopButton() {
      activeButtonX = stopButtonX;
      activeButtonY = stopButtonY;
      activeButtonRadius = buttonRadius;
    }
    function logMouseEvent(x: number, y: number, timestamp: number) {
      let eventRecord = { x: x, y: y, t: timestamp };
      mouseData.push(eventRecord);
    }
    function insideCanvas(x: number, y: number): boolean {
      const delta = 2;
      let result =
        x > -maskWidth / 2 - delta &&
        x < canvasWidth + maskWidth / 2 + delta &&
        y > -maskHeight / 2 - delta &&
        y < canvasHeight + maskHeight / 2 + delta;
      return result;
    }
    function onMove(event: MouseEvent) {
      let e = canvasMousePos(event, canvasShown);
      let cx = Math.round(e.x),
        cy = Math.round(e.y);
      if (cx == lastX && cy == lastY) {
        // no move after rounding coordinates
      } else {
        // the cursor moved
        if (!waitingForStart) {
          // we are in the mouse-reading phase of the experiment
          logMouseEvent(cx, cy, performance.now() - startTime);
        }
        if (insideCanvas(cx, cy)) {
          // mouse affects canvas (inside or just beyond the boundary)
          redraw = true;
        } else {
          // mouse too far away, redraw only if just left
          redraw = redraw || insideCanvas(lastX, lastY);
        }
        lastX = cx;
        lastY = cy;

        if (!waitingForStart && hideCursor) {
          // check button distance for cursor hiding
          let dx = cx - activeButtonX;
          let dy = cy - activeButtonY;
          let dd = Math.sqrt(dx * dx + dy * dy);
          if (dd < cursorDistance) {
            canvasShown.style.cursor = "pointer";
          } else {
            canvasShown.style.cursor = "none";
          }
        }
      }
    }
    function onMouseDown(event: MouseEvent) {
      let e = canvasMousePos(event, canvasShown);
      let dx = e.x - activeButtonX;
      let dy = e.y - activeButtonY;
      let dd = Math.sqrt(dx * dx + dy * dy);
      let clicked = dd < activeButtonRadius;
      if (clicked) {
        if (waitingForStart) {
          // start was clicked
          lastX = Math.round(e.x);
          lastY = Math.round(e.y);
          waitingForStart = false;
          redraw = true;
          startTime = performance.now();
          activateStopButton();
        } else {
          // already collecting data, stop clicked
          end_trial();
        }
      }
    }

    // start trial
    wordBoxes = this.measureText(ctxShown, trial);
    const lastWord = wordBoxes.at(-1)?.at(-1);
    stopButtonX = lastWord.right + stopOffsetX;
    stopButtonY = lastWord.baseline - stopOffsetY;

    setupGraphics();

    timeZero = performance.now();
    activateStartButton();
    animateMouseMotion();
    document.addEventListener("mousemove", onMove, false);
    document.addEventListener("mousedown", onMouseDown, false);
    // no more code to run within trial
    // only function definitions are below

    // function to end trial when it is time
    function end_trial(): void {
      let stopTime = performance.now();
      // data saving
      let trial_data = {
        word_boxes: wordBoxes,
        image_data: imageData,
        mouse_data: mouseData,
        start_time: startTime - timeZero,
        reading_time: stopTime - startTime,
        start_button: [startButtonX, startButtonY],
        stop_button: [stopButtonX, stopButtonY],
      };

      window.cancelAnimationFrame(frameRequestID);
      document.removeEventListener("mousemove", onMove, false);
      document.removeEventListener("mousedown", onMouseDown, false);
      display_element.innerHTML = "";

      // end trial
      jsPsych.finishTrial(trial_data);
    }
  }

  private measureText(ctx: CanvasRenderingContext2D, itrial: TrialType<Info>): WordBox[][] {
    const lineHeight = itrial.line_height;
    const lines = itrial.text_lines as string[];
    let x = itrial.text_offset[0];
    let y = itrial.text_offset[1];
    let allWordBoxes = [];

    // setup text
    ctx.font = textFontFromProperties(itrial);
    ctx.fillStyle = itrial.font_colour;
    ctx.textRendering = itrial.text_rendering as CanvasTextRendering;

    for (let i = 0; i < lines.length; i++) {
      let l = lines[i];
      //ctx.fillText(l, x, y);
      let boundaries = findWordBoundaries(l);
      let wordStarts = boundaries.start;
      let wordEnds = boundaries.end;
      let wordBoxesOnLine = [];
      for (let w = 0; w < wordStarts.length; w++) {
        let textBefore = l.slice(0, wordStarts[w]);
        let textWord = l.slice(wordStarts[w], wordEnds[w]);
        let mText = ctx.measureText(textBefore);
        let mWord = ctx.measureText(textWord);
        let wordBox = wordCoordinates(textWord, mWord, x + mText.width, y);
        wordBoxesOnLine.push(wordBox);
      }
      allWordBoxes.push(wordBoxesOnLine);
      y += lineHeight;
    }
    return allWordBoxes;
  }

  simulate(
    trial: TrialType<Info>,
    simulation_mode: string,
    simulation_options: any,
    load_callback: () => void
  ) {
    if (simulation_mode == "data-only") {
      load_callback();
      this.simulate_data_only(trial, simulation_options);
    }
    if (simulation_mode == "visual") {
      //this.simulate_visual(trial, simulation_options, load_callback);
    }
  }

  private create_simulated_mouse_data(
    px: number[],
    py: number[],
    speed: number,
    framerate: number
  ) {
    // eventRecord = { x: x, y: y, t: timestamp };
    let data = [];
    let startTime = 0;
    for (let p = 0; p < px.length - 1; p++) {
      let line = createSimulatedMouseDataAlongLine(
        px[p],
        py[p],
        px[p + 1],
        py[p + 1],
        speed,
        framerate,
        startTime
      );
      if (data.length == 0) {
        data = [...data, ...line];
      } else {
        data = [...data, ...line.slice(1)];
      }
      startTime = line.at(-1).t;
    }
    return data;
  }
  private create_simulation_data(trial: TrialType<Info>, simulation_options) {
    const canvas = document.createElement("canvas");
    canvas.height = trial.canvas_size[0];
    canvas.width = trial.canvas_size[1];

    const wordBoxes = this.measureText(canvas.getContext("2d"), trial);
    // buttons
    const lastWord = wordBoxes.at(-1)?.at(-1);
    const stopOffsetX =
      trial.button_offset.length == 2 ? trial.button_offset[0] : trial.button_offset[2];
    const stopOffsetY =
      trial.button_offset.length == 2 ? trial.button_offset[1] : trial.button_offset[3];
    const startButtonX = trial.text_offset[0] - trial.button_offset[0];
    const startButtonY = trial.text_offset[1] - trial.button_offset[1];
    const stopButtonX = lastWord.right + stopOffsetX;
    const stopButtonY = lastWord.baseline - stopOffsetY;

    // reading trajectory
    let pointsX = [],
      pointsY = [];
    pointsX.push(startButtonX);
    pointsY.push(startButtonY);
    for (let line = 0; line < wordBoxes.length; line++) {
      for (let word = 0; word < wordBoxes[line].length; word++) {
        const wb = wordBoxes[line][word];
        pointsX.push(wb.left);
        pointsY.push(wb.baseline);
        pointsX.push(wb.right);
        pointsY.push(wb.baseline);
      }
    }
    pointsX.push(stopButtonX);
    pointsY.push(stopButtonY);

    // speed in pixels per second
    const speed = simulation_options.speed ?? 200;
    // frame rate in number of samples per second
    const framerate = simulation_options.framerate ?? 20;
    const mouseData = this.create_simulated_mouse_data(pointsX, pointsY, speed, framerate);

    let trial_data = {
      word_boxes: wordBoxes,
      image_data: "", // not implemented in simulation
      mouse_data: mouseData,
      start_time: this.jsPsych.randomization.sampleExGaussian(1000, 100, 1 / 150, true),
      reading_time: mouseData.at(-1).t,
      start_button: [startButtonX, startButtonY],
      stop_button: [stopButtonX, stopButtonY],
    };
    return trial_data;
  }
  private simulate_data_only(trial: TrialType<Info>, simulation_options) {
    const data = this.create_simulation_data(trial, simulation_options);

    this.jsPsych.finishTrial(data);
  }
}

export default MouseReadingPlugin;
