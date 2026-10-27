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

    await expectFinished();
  });
});
