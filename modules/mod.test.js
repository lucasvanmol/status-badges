import github from "@actions/github";
import {
  getLastCommitDate,
  subtractDurationFromDate,
  findAndPlaceBadges,
} from "./mod";

const octokit = github.getOctokit("TOKEN");
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

describe("getLastCommitDate", () => {
  test("active repo is detected", async () => {
    const owner = "test-owner";
    const repo = "active-repo";
    const date = await getLastCommitDate(octokit, owner, repo);
    expect(date > threeMonthsAgo).toBeTruthy();
  });

  test("inactive repo is detected", async () => {
    const owner = "test-owner";
    const repo = "inactive-repo";
    const date = await getLastCommitDate(octokit, owner, repo);
    expect(date > threeMonthsAgo).toBeFalsy();
  });
});

describe("subtractDurationFromDate", () => {
  const originDate = new Date(2000, 1, 8);
  test("can subtract 12 days", () => {
    const newDate = subtractDurationFromDate(originDate, "12 days");
    expect(newDate).toEqual(new Date(2000, 0, 27));
  });

  test("can subtract a week", () => {
    const newDate = subtractDurationFromDate(originDate, "1 week");
    expect(newDate).toEqual(new Date(2000, 1, 1));
  });

  test("can subtract 2 months", () => {
    const newDate = subtractDurationFromDate(originDate, "2 months");
    expect(newDate).toEqual(new Date(1999, 11, 8));
  });

  test("can subtract a year", () => {
    const newDate = subtractDurationFromDate(originDate, "1 year");
    expect(newDate).toEqual(new Date(1999, 1, 8));
  });

  test("throws on bad inputs", () => {
    expect(() => {
      subtractDurationFromDate(originDate, "asdlk");
    }).toThrow(Error);
    expect(() => {
      subtractDurationFromDate(originDate, "1.2 months");
    }).toThrow(Error);
  });
});

describe("findAndPlaceBadges", () => {
  const config = {
    staleDate: oneMonthAgo,
    inactiveDate: threeMonthsAgo,
    notFoundEmoji: ":grey_question:",
    inactiveEmoji: ":red_circle:",
    staleEmoji: ":yellow_circle:",
    activeEmoji: ":green_circle:",
  };

  test("works for hyperlinks", async () => {
    const text =
      "[Active link](https://github.com/test-owner/active-repo) <!--STATUS_BADGE-->";
    const textWithBadges =
      "[Active link](https://github.com/test-owner/active-repo) :green_circle: <!--STATUS_BADGE-->";
    const updatedText = await findAndPlaceBadges(octokit, text, config, false);
    expect(updatedText).toEqual(textWithBadges);
  });

  test("works for direct links", async () => {
    const text =
      "This repo is inactive: https://github.com/test-owner/inactive-repo <!--STATUS_BADGE-->";
    const textWithBadges =
      "This repo is inactive: https://github.com/test-owner/inactive-repo :red_circle: <!--STATUS_BADGE-->";
    const updatedText = await findAndPlaceBadges(octokit, text, config, false);
    expect(updatedText).toEqual(textWithBadges);
  });

  test("can use findAll option", async () => {
    const text =
      "https://github.com/test-owner/inactive-repo <!--STATUS_BADGE-->, [repo 1](https://github.com/test-owner/inactive-repo), [repo 2](https://github.com/test-owner/active-repo) <!--NO_STATUS_BADGE-->, https://github.com/test-owner/active-repo , [repo 2](https://github.com/test-owner/stale-repo)!";
    const textWithBadges =
      "https://github.com/test-owner/inactive-repo :red_circle: <!--STATUS_BADGE-->, [repo 1](https://github.com/test-owner/inactive-repo) :red_circle: , [repo 2](https://github.com/test-owner/active-repo) <!--NO_STATUS_BADGE-->, https://github.com/test-owner/active-repo :green_circle: , [repo 2](https://github.com/test-owner/stale-repo) :yellow_circle: !";
    const updatedText = await findAndPlaceBadges(octokit, text, config, true);
    expect(updatedText).toEqual(textWithBadges);
  });

  test("can replace badges", async () => {
    const text =
      "https://github.com/test-owner/inactive-repo :green_circle: <!--STATUS_BADGE-->";
    const textWithBadges =
      "https://github.com/test-owner/inactive-repo :red_circle: <!--STATUS_BADGE-->";
    const updatedText = await findAndPlaceBadges(octokit, text, config, false);
    expect(updatedText).toEqual(textWithBadges);
  });

  test("can handle 404s", async () => {
    const text =
      "https://github.com/test-owner/unexistant-repo <!--STATUS_BADGE-->";
    const textWithBadges =
      "https://github.com/test-owner/unexistant-repo :grey_question: <!--STATUS_BADGE-->";
    const updatedText = await findAndPlaceBadges(octokit, text, config, false);
    expect(updatedText).toEqual(textWithBadges);
  });

  test("can handle rate limiting", async () => {
    const text =
      "https://github.com/test-owner/ratelimit-repo <!--STATUS_BADGE-->";
    await expect(findAndPlaceBadges(octokit, text, config, false)).rejects.toThrow("Rate limit error:");
  });
});
