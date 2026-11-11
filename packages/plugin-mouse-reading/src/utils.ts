/**
 * Find the word boundaries in a line of text.
 *
 * Words are runs of non-space characters separated by one or more spaces.
 * Only the space character (" ") is treated as a separator, so tabs and other
 * whitespace are part of a word. Leading and trailing spaces are ignored.
 *
 * The returned indices are suitable for `String.prototype.slice`:
 * `sentence.slice(start[i], end[i])` gives the i-th word.
 *
 * @param sentence - The line of text to split.
 * @returns `start` holds the index of each word's first character, and `end`
 *   holds the index just past each word's last character (exclusive). Both
 *   arrays have one entry per word, and both are empty if the text has no words.
 *
 * @example
 * findWordBoundaries("  The cat ");
 * // { start: [2, 6], end: [5, 9] }
 */
export function findWordBoundaries(sentence: string) {
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

export interface WordBox {
  word: string;
  left: number;
  right: number;
  width: number;
  height: number;
  baseline: number;
  top: number;
  bottom: number;
}

/**
 * Compute the bounding box of a word drawn on the canvas.
 *
 * The box is derived from the measured text width and the font's bounding-box
 * ascent and descent, so its height is the same for every word in a given font
 * (it does not depend on the particular glyphs). All coordinates are in canvas
 * pixels, with the y axis pointing down.
 *
 * @param word - The word that was measured.
 * @param measures - Result of `CanvasRenderingContext2D.measureText(word)`,
 *   taken with the same font that is used to draw the word.
 * @param offX - X coordinate of the left edge of the word (the x passed to `fillText`).
 * @param offY - Y coordinate of the word's baseline (the y passed to `fillText`).
 * @returns An object with:
 *   - `word`: the word itself,
 *   - `left`, `right`: horizontal extent of the word,
 *   - `width`: `right - left`,
 *   - `top`, `bottom`: vertical extent, `fontBoundingBoxAscent` above and
 *     `fontBoundingBoxDescent` below the baseline,
 *   - `height`: `bottom - top`,
 *   - `baseline`: the baseline y coordinate (same as `offY`).
 *
 * @example
 * const m = ctx.measureText("cat");
 * wordCoordinates("cat", m, 10, 50);
 * // { word: "cat", left: 10, right: 10 + m.width, width: m.width, ... baseline: 50 }
 */
export function wordCoordinates(
  word: string,
  measures: TextMetrics,
  offX: number,
  offY: number
): WordBox {
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

/**
 * Save the current contents of a canvas as a PNG file.
 *
 * The canvas is encoded as a PNG data URL and downloaded by clicking a
 * temporary `<a download>` link, so the browser saves the file without any
 * server involvement. The link is not added to the page. This must run in a
 * browser, and some browsers only allow the download when it is triggered
 * from a user action such as a click.
 *
 * @param canvas - The canvas to export.
 * @param filename - Name for the downloaded file, including the extension
 *   (for example `"trial1.png"`).
 *
 * @example
 * saveCanvas(canvas, "mouse-reading-trial-1.png");
 */

export function saveCanvas(canvas: HTMLCanvasElement, filename: string) {
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  link.click();
}

/**
 * Convert a mouse event position to canvas coordinates.
 *
 * Takes the event's viewport position (`clientX`/`clientY`), subtracts the
 * canvas's on-screen offset, and rescales by the ratio of the canvas's internal
 * resolution (`canvas.width`/`height`) to its displayed size. The result is in
 * canvas pixels, with the origin at the top-left corner and y pointing down,
 * so it stays correct when the canvas is scaled by CSS or the page is zoomed.
 *
 * @param e - The mouse event, from any element or from `document`.
 * @param canvas - The canvas whose coordinate system to use.
 * @returns The position `{ x, y }` in canvas pixels. Values fall outside
 *   `[0, canvas.width]` and `[0, canvas.height]` if the pointer is outside the canvas.
 *
 * @example
 * document.addEventListener("mousemove", (e) => {
 *   const { x, y } = canvasMousePos(e, canvas);
 * });
 */
export function canvasMousePos(e: MouseEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}

/**
 * Simulate a straight, constant-speed mouse movement between two points.
 *
 * Returns samples as a mouse recorder would log them: one sample every
 * `1000 / frame` ms along the line, starting at `startTime`. The first sample is
 * always exactly `(x1, y1)` at `startTime`, and the last is always exactly
 * `(x2, y2)` at `startTime + duration`, where `duration = distance / speed`.
 * Because the movement rarely ends on a sample boundary, the last interval is
 * usually shorter than `1000 / frame` ms. If the two points are identical, a
 * single sample is returned.
 *
 * Coordinates are not rounded, so they can be fractional pixels.
 *
 * @param x1 - X coordinate of the start point, in canvas pixels.
 * @param y1 - Y coordinate of the start point, in canvas pixels.
 * @param x2 - X coordinate of the end point, in canvas pixels.
 * @param y2 - Y coordinate of the end point, in canvas pixels.
 * @param speed - Movement speed in pixels per second. Must be positive.
 * @param frame - Sampling rate in samples per second (Hz). Must be positive.
 * @param startTime - Time of the first sample, in milliseconds.
 * @returns Samples `{ x, y, t }` in time order, with `t` in milliseconds.
 * @throws If `speed` or `frame` is not a positive number.
 *
 * @example
 * create_simulated_mouse_data_along_line(0, 0, 100, 0, 100, 10, 0);
 * // 11 samples: { x: 0, y: 0, t: 0 }, { x: 10, y: 0, t: 100 }, ... { x: 100, y: 0, t: 1000 }
 */
export function createSimulatedMouseDataAlongLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  speed: number, // pixels per second
  frame: number, // samples per second
  startTime: number // ms
): { x: number; y: number; t: number }[] {
  if (!(speed > 0) || !(frame > 0)) {
    throw new Error("speed and frame must be positive numbers.");
  }
  const distance = Math.hypot(x2 - x1, y2 - y1);
  if (distance === 0) {
    return [{ x: x1, y: y1, t: startTime }];
  }

  const duration = (distance / speed) * 1000; // ms
  const dt = 1000 / frame; // ms between samples
  const points: { x: number; y: number; t: number }[] = [];

  // samples strictly before the end, spaced dt apart
  for (let i = 0; i * dt < duration; i++) {
    const f = (i * dt) / duration; // fraction of the way, 0 <= f < 1
    points.push({ x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f, t: startTime + i * dt });
  }
  // the last point is always the exact end point
  points.push({ x: x2, y: y2, t: startTime + duration });
  return points;
}
