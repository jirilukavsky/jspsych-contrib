import { startTimeline } from "@jspsych/test-utils";

import jsPsychMouseReading from ".";

jest.useFakeTimers();

describe("mouse-reading plugin", () => {
  it("should load", async () => {
    const { expectFinished, getHTML, getData, displayElement, jsPsych } = await startTimeline([
      {
        type: jsPsychMouseReading,
        text_lines: ["A very short text."],
      },
    ]);

    // minimal version
    await expect(displayElement.querySelector("canvas"));
    // later I plan to add 2 simulated mouse clicks
    // I know the offset, but the location of the stop button
    // depends on the text length which we do not know

    // await expectFinished();
  });
});
