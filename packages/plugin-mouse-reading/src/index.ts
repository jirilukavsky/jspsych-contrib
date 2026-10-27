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
    /** The time between the start and stop buttons were clicked, in milliseconds,
     * i.e. zero means stop button was clicked immediately after start button.*/
    reading_time: {
      type: ParameterType.FLOAT,
    },
    /** Array of mouse events. Times are relative to the start_time (start button clicked). */
    mouse_data: {
      type: ParameterType.OBJECT,
    },
    /** Array of array of word coordinates. The top-level array corresponds to the text line, each array element on the second level correspons to one word.
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
    let lastTimeStamp = performance.now();
    // canvas size
    const canvasHeight = trial.canvas_size[0];
    const canvasWidth = trial.canvas_size[1];
    const canvasColour = trial.canvas_colour;
    // mask size
    const maskWidth = apertureWidth + apertureBlur * 2;
    const maskHeight = apertureHeight + apertureBlur * 2;
    let maskShape = "circular";
    if (trial.aperture_shape.toLowerCase().startsWith("circ")) maskShape = "circular";
    if (trial.aperture_shape.toLowerCase().startsWith("rect")) maskShape = "rectangular";
    if (trial.aperture_shape.toLowerCase().startsWith("round")) maskShape = "roundrectangular";
    if (trial.aperture_shape.toLowerCase().startsWith("el")) maskShape = "elliptical";
    // text position
    const textOffsetX = trial.text_offset[0];
    const textOffsetY = trial.text_offset[1];
    let textFont = trial.font_weight + " " + trial.font_size + " " + trial.font_family;
    // button placement
    const buttonOffsets = [...trial.button_offset, ...trial.button_offset];
    const startOffsetX = buttonOffsets[0];
    const startOffsetY = buttonOffsets[1];
    const stopOffsetX = buttonOffsets[2];
    const stopOffsetY = buttonOffsets[3];
    const buttonRadius = trial.button_size / 2;
    const cursorDistance = trial.cursor_distance;
    let lastLineWidth = 0;
    let lastLineY = 0;
    let startButtonX = 0;
    let startButtonY = 0;
    let stopButtonX = 0;
    let stopButtonY = 0;

    // clicks
    var activeButtonX = -trial.canvas_size[0];
    var activeButtonY = -trial.canvas_size[1];
    var activeButtonRadius = buttonRadius;
    var waitingForStart = true;
    const hideCursor = true;
    // other data
    var frameRequestID;
    var mouseData = [];
    let jsPsych = this.jsPsych;
    let wordBoxes = [];
    const showSegmentation = trial.show_segmentation;
    const storeImageData = trial.store_image_data;
    let imageData = "";
    let startTime: number; // clicked Start, as performance.now()
    let stopTime: number; // clicked Stop, as performance.now()
    let timeZero: number; // start of the trial, as performance.now()

    // Create canvas
    const stimulusElement = document.createElement("div");
    stimulusElement.id = "jspsych-canvas-button-response-stimulus";

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
    canvasMask.height = maskHeight;
    canvasMask.width = maskWidth;

    stimulusElement.appendChild(canvasShown);
    display_element.appendChild(stimulusElement);

    let ctx = canvasShown.getContext("2d"); // final canvas context
    let ctxb = canvasBlur.getContext("2d"); // blurred
    let ctxs = canvasSharp.getContext("2d"); // sharp
    let ctxm = canvasMask.getContext("2d"); // mask
    let ctxt = canvasTemporary.getContext("2d"); // temporary

    function draw_text(ctx: CanvasRenderingContext2D): void {
      const lineHeight = trial.line_height;
      const lines = trial.text_lines as string[];
      let x = textOffsetX;
      let y = textOffsetY;

      // draw text
      ctx.font = textFont;
      ctx.fillStyle = trial.font_colour;
      ctx.textRendering = trial.text_rendering as CanvasTextRendering;

      for (const l of lines) {
        ctx.fillText(l, x, y);
        y += lineHeight;
      }
    }
    function measure_text(ctx: CanvasRenderingContext2D): void {
      const lineHeight = trial.line_height;
      const lines = trial.text_lines as string[];
      let x = textOffsetX;
      let y = textOffsetY;

      // setup text
      ctx.font = textFont;
      ctx.fillStyle = trial.font_colour;
      ctx.textRendering = trial.text_rendering as CanvasTextRendering;

      for (let i = 0; i < lines.length; i++) {
        let l = lines[i];
        //ctx.fillText(l, x, y);
        let boundaries = findWordBoundaries(l);
        let wordStarts = boundaries.start;
        let wordEnds = boundaries.end;
        let wordBoxesOnLine = [];
        for (let i = 0; i < wordStarts.length; i++) {
          let textBefore = l.slice(0, wordStarts[i]);
          let textWord = l.slice(wordStarts[i], wordEnds[i]);
          let mText = ctx.measureText(textBefore);
          let mWord = ctx.measureText(textWord);
          let wordBox = wordCoordinates(textWord, mWord, textOffsetX + mText.width, y);
          wordBoxesOnLine.push(wordBox);
        }
        wordBoxes.push(wordBoxesOnLine);
        if (i == lines.length - 1) {
          // last line
          lastLineY = y;
          let mText = ctx.measureText(l);
          lastLineWidth = mText.width;
        }
        y += lineHeight;
      }
    }
    function wordCoordinates(word: string, measures: TextMetrics, offX: number, offY: number) {
      let coords = {
        word: word,
        left: offX,
        right: offX + measures.width,
        width: measures.width,
        height: measures.fontBoundingBoxAscent + measures.fontBoundingBoxDescent,
        baseline: offY,
        top: offY - measures.fontBoundingBoxAscent,
        bottom: offY + measures.fontBoundingBoxDescent,
      };
      return coords;
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
    function drawImageCircularUsingMask(
      source: CanvasRenderingContext2D,
      destination: CanvasRenderingContext2D,
      sx: number,
      sy: number,
      dx: number,
      dy: number
    ): void {
      ctxt.globalCompositeOperation = "source-over";
      ctxt.fillStyle = canvasColour;
      ctxt.fillRect(0, 0, maskWidth, maskHeight);
      ctxt.drawImage(
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

      /* ---------- 5️⃣ Apply the mask (destination‑in) ---------- */
      ctxt.globalCompositeOperation = "destination-in";
      ctxt.drawImage(canvasMask, 0, 0);

      /* ---------- 6️⃣ Finally draw the masked region onto the destination ---------- */
      // Here we place it at a different location just to illustrate the effect
      destination.drawImage(
        ctxt.canvas,
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
      // draw combined
      measure_text(ctx);
      updateButtonLocation();

      // draw text blurred
      ctxb.filter = `blur(${textBlur}px)`;
      draw_text(ctxb);
      draw_target(ctxb, stopButtonX, stopButtonY, buttonRadius, "darkred");
      ctxb.filter = "none";

      // draw text sharp
      draw_text(ctxs);
      draw_target(ctxs, stopButtonX, stopButtonY, buttonRadius, "darkred");
      if (showSegmentation) {
        drawWordBoxes(ctxs);
      }
      if (storeImageData) {
        imageData = canvasSharp.toDataURL("image/png");
      }
      // draw mask
      switch (maskShape) {
        case "circular":
          prepareMaskCircular();
          break;
        case "rectangular":
          prepareMaskRectangular();
          break;
        case "roundrectangular":
          prepareMaskRoundRectangular();
          break;
        case "elliptical":
          prepareMaskElliptical();
          break;
      }
      // saveCanvas(canvasMask, "mask.png");
      // end of drawing
    }
    function saveCanvas(canvas, filename) {
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = filename;
      link.click();
    }
    function prepareMaskCircular() {
      ctxm.fillStyle = "rgba(255,255,255,0)";
      ctxm.fillRect(0, 0, maskWidth, maskHeight);
      ctxm.filter = `blur(${apertureBlur}px)`;
      ctxm.fillStyle = "rgba(255,255,255,1)";

      ctxm.beginPath();
      ctxm.arc(maskWidth / 2, maskHeight / 2, apertureWidth / 2, 0, 2 * Math.PI, false);
      ctxm.fill();

      ctxm.filter = "none";
      ctxm.globalCompositeOperation = "source-over";
    }
    function prepareMaskElliptical() {
      ctxm.fillStyle = "rgba(255,255,255,0)";
      ctxm.fillRect(0, 0, maskWidth, maskHeight);
      ctxm.filter = `blur(${apertureBlur}px)`;
      ctxm.fillStyle = "rgba(255,255,255,1)";

      ctxm.beginPath();
      ctxm.ellipse(
        maskWidth / 2,
        maskHeight / 2,
        apertureWidth / 2,
        apertureHeight / 2,
        0,
        0,
        2 * Math.PI,
        false
      );
      ctxm.fill();

      ctxm.filter = "none";
      ctxm.globalCompositeOperation = "source-over";
    }
    function prepareMaskRectangular() {
      ctxm.fillStyle = "rgba(255,255,255,0)";
      ctxm.fillRect(0, 0, maskWidth, maskHeight);
      ctxm.filter = `blur(${apertureBlur}px)`;
      ctxm.fillStyle = "rgba(255,255,255,1)";

      ctxm.fillRect(apertureBlur, apertureBlur, apertureWidth, apertureHeight);

      ctxm.filter = "none";
      ctxm.globalCompositeOperation = "source-over";
    }

    function prepareMaskRoundRectangular() {
      ctxm.fillStyle = "rgba(255,255,255,0)";
      ctxm.fillRect(0, 0, maskWidth, maskHeight);
      ctxm.filter = `blur(${apertureBlur}px)`;
      ctxm.fillStyle = "rgba(255,255,255,1)";

      ctxm.beginPath();
      ctxm.roundRect(
        apertureBlur,
        apertureBlur,
        apertureWidth,
        apertureHeight,
        apertureCornerRadius
      );
      ctxm.fill();

      ctxm.filter = "none";
      ctxm.globalCompositeOperation = "source-over";
    }
    function animateMouseMotion(): void {
      frameRequestID = window.requestAnimationFrame(animate);
      function animate() {
        if (!waitingForStart) {
          logMouseEvent(lastX, lastY, performance.now() - startTime);
        }
        if (redraw) {
          ctx.fillStyle = canvasColour;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          if (waitingForStart) {
            draw_target(ctx, startButtonX, startButtonY, buttonRadius, "green");
          } else {
            ctx.drawImage(ctxb.canvas, 0, 0);
            drawImageCircularUsingMask(ctxs, ctx, lastX, lastY, lastX, lastY);
          }

          redraw = false;
          let now = performance.now();
          lastTimeStamp = now;
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
    function updateButtonLocation() {
      startButtonX = textOffsetX - startOffsetX;
      startButtonY = textOffsetY - startOffsetY;
      stopButtonX = textOffsetX + lastLineWidth + stopOffsetX;
      stopButtonY = lastLineY - stopOffsetY;
    }
    function logMouseEvent(x: number, y: number, timestamp: number) {
      let eventRecord = { x: x, y: y, t: timestamp };
      mouseData.push(eventRecord);
    }
    function canvasMousePos(e: MouseEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (canvas.width / r.width),
        y: (e.clientY - r.top) * (canvas.height / r.height),
      };
    }
    function onMove(event: MouseEvent) {
      let e = canvasMousePos(event, canvasShown);
      let cx = Math.round(e.x),
        cy = Math.round(e.y);
      if (cx == lastX && cy == lastY) {
        // no move after rounding coordinates
        redraw = false;
      } else {
        lastX = cx;
        lastY = cy;
        if (
          cx > -apertureWidth / 2 &&
          cx < canvasWidth + apertureWidth / 2 &&
          cy > -apertureHeight / 2 &&
          cy < canvasHeight + apertureHeight / 2
        ) {
          // mouse affects canvas (inside or just beyond the boundary)
          redraw = true;
        } else {
          // mouse too far away
          redraw = false;
        }
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
    function onMouseUp(event: MouseEvent) {
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
    setupGraphics();
    timeZero = performance.now();
    activateStartButton();
    animateMouseMotion();
    document.addEventListener("mousemove", onMove, false);
    document.addEventListener("mouseup", onMouseUp, false);

    // data saving
    var trial_data = {
      word_boxes: wordBoxes,
      image_data: imageData,
      mouse_data: mouseData,
      start_time: -1,
      reading_time: -1,
      start_button: [startButtonX, startButtonY],
      stop_button: [stopButtonX, stopButtonY],
    };

    // function to end trial when it is time
    function end_trial(): void {
      stopTime = performance.now();
      window.cancelAnimationFrame(frameRequestID);

      document.removeEventListener("mousemove", onMove, false);
      document.removeEventListener("mouseup", onMouseUp, false);

      // gather the data to store for the trial
      trial_data.start_time = startTime - timeZero;
      trial_data.reading_time = stopTime - startTime;

      canvasShown.style.cursor = "default"; // optional, see below
      display_element.innerHTML = "";
      // end trial
      jsPsych.finishTrial(trial_data);
    }
    function findWordBoundaries(sentence: string) {
      let startPositions = [];
      let endPositions = [];
      let wordStarted = false;
      for (let i = 0; i < sentence.length; i++) {
        if (sentence[i] == " ") {
          if (wordStarted) {
            wordStarted = false;
            endPositions.push(i);
          }
        } else {
          if (!wordStarted) {
            wordStarted = true;
            startPositions.push(i);
          }
        }
      }
      if (wordStarted) endPositions.push(sentence.length);
      return { start: startPositions, end: endPositions };
    }
  }
  // utility functions potentially shared between trial() and simulate()
}

export default MouseReadingPlugin;
