import core from "@actions/core";
import github from "@actions/github";
import { promises as fs } from "fs";
import { findAndPlaceBadges, subtractDurationFromDate } from "./modules/mod.js";
import { simpleGit } from "simple-git";

const main = async () => {
  const myToken = core.getInput("token");
  const octokit = github.getOctokit(myToken);
  const context = github.context;

  const path = core.getInput("path");
  const content = await fs.readFile(path, "utf8");

  const staleDateInput = core.getInput("stale-timeout");
  const inactiveDateInput = core.getInput("inactive-timeout");

  const dateNow = new Date();
  const staleDate = subtractDurationFromDate(
    dateNow,
    staleDateInput,
    "stale-timeout"
  );
  const inactiveDate = subtractDurationFromDate(
    dateNow,
    inactiveDateInput,
    "inactive-timeout"
  );

  const notFoundEmoji = core.getInput("not-found-emoji");
  const inactiveEmoji = core.getInput("inactive-emoji");
  const staleEmoji = core.getInput("stale-emoji");
  const activeEmoji = core.getInput("active-emoji");

  const config = {
    staleDate: staleDate,
    inactiveDate: inactiveDate,
    notFoundEmoji: notFoundEmoji,
    inactiveEmoji: inactiveEmoji,
    staleEmoji: staleEmoji,
    activeEmoji: activeEmoji,
  };

  const findAllLinksInput = core.getInput("find-all-links");
  if (findAllLinksInput !== "true" && findAllLinksInput !== "false") {
    throw Error("Parameter `find-all-links` must set to `true` or `false`");
  }
  const findAll = findAllLinksInput === "true";

  const updatedContent = await findAndPlaceBadges(octokit, content, config, findAll);

  core.debug("\n---- OLD TEXT ----\n");
  core.debug(content);
  core.debug("\n---- NEW TEXT ----\n");
  core.debug(updatedContent);

  const doPullRequest = core.getInput("pull-request") === "true";

  if (content !== updatedContent) {
    // Setup git
    const git = simpleGit();
    await git
      .addConfig("user.name", "github-actions[bot]")
      .addConfig("user.email", "github-actions[bot]@users.noreply.github.com");

    const base = (await git.branchLocal()).current;

    if (doPullRequest) {
      // Push to user-specified branch
      const head = core.getInput("pr-branch");
      await git.branch(head);
      await git.checkout(head);

      // Update the file content locally & commit to pr-branch
      await fs.writeFile(path, updatedContent);
      await git.commit("Update status badges", path);
      await git.push("origin", head, ["--set-upstream"]);

      // https://github.com/lucasvanmol/status-badges/pull/4/files
      await octokit.rest.pulls.create({
        ...context.repo,
        head,
        base,
        title: "Update status badges",
      });
    } else {
      // Update the file content locally & commit directly to main branch
      await fs.writeFile(path, updatedContent);
      await git.commit("Update status badges", path);

      await git.pull(undefined, undefined, ["--rebase"]);
      await git.push("origin", base);
    }
  } else {
    core.info("All badges were found to be up-to-date");
  }
};

main().catch((err) => core.setFailed(err.message));
