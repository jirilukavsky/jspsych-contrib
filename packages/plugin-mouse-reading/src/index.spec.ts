import { simulateTimeline, startTimeline } from "@jspsych/test-utils";

import { findWordBoundaries } from "./utils";
import jsPsychMouseReading from ".";

jest.useFakeTimers();

describe("mouse-reading plugin", () => {
  test("should load", async () => {
    const { expectFinished, getHTML, getData, displayElement, jsPsych } = await startTimeline([
      {
        type: jsPsychMouseReading,
        text_lines: ["A very short text."],
      },
    ]);

    // minimal version
    await expect(displayElement.querySelector("canvas")).not.toBeNull();
    // later I plan to add 2 simulated mouse clicks
    // I know the offset, but the location of the stop button
    // depends on the text length which we do not know

    // await expectFinished();
  });
});

describe("mouse-reading simulation", () => {
  test("data mode works", async () => {
    const { expectFinished, getData } = await simulateTimeline(
      [
        {
          type: jsPsychMouseReading,
          text_lines: ["A very short text."],
        },
      ],
      "data-only"
    );
    // TODO the test is not working now
    await expectFinished();
    const response = getData().values()[0].response;
    console.log(response);
    // minimal version
    //await expect(displayElement.querySelector("canvas")).not.toBeNull();
    // later I plan to add 2 simulated mouse clicks
    // I know the offset, but the location of the stop button
    // depends on the text length which we do not know

    // await expectFinished();
  });
});

describe("findWordBoundaries", () => {
  test("finds start and exclusive end of each word", () => {
    expect(findWordBoundaries("The cat sat")).toEqual({ start: [0, 4, 8], end: [3, 7, 11] });
  });

  test("ignores leading, trailing and repeated spaces", () => {
    expect(findWordBoundaries("  The   cat ")).toEqual({ start: [2, 8], end: [5, 11] });
  });

  test("returns empty arrays for empty or space-only text", () => {
    expect(findWordBoundaries("")).toEqual({ start: [], end: [] });
    expect(findWordBoundaries("   ")).toEqual({ start: [], end: [] });
  });

  test("handles a single word with no spaces", () => {
    expect(findWordBoundaries("Hello")).toEqual({ start: [0], end: [5] });
  });

  test("treats tabs as part of a word", () => {
    expect(findWordBoundaries("a\tb c")).toEqual({ start: [0, 4], end: [3, 5] });
  });

  test("indices work with slice", () => {
    const s = " quick  brown fox ";
    const { start, end } = findWordBoundaries(s);
    expect(start.map((st, i) => s.slice(st, end[i]))).toEqual(["quick", "brown", "fox"]);
  });
});
