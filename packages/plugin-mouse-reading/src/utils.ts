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
