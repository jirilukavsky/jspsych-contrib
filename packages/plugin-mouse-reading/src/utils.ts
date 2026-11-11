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
