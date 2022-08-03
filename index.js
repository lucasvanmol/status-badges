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

  const updatedContent = await findAndPlaceBadges(
    octokit,
    content,
    config,
    findAll
  );

  const doPullRequest = core.getInput("pull-request") === "true";

  if (content !== updatedContent) {
    // Setup git
    const git = simpleGit();
    await git
      .addConfig("user.name", "github-actions[bot]")
      .addConfig("user.email", "github-actions[bot]@users.noreply.github.com");

    const branches = await git.branchLocal();
    const base = branches.current;
    core.debug(
      `Git initialized locally, found branches: ${JSON.stringify(branches)}`
    );
    core.debug(`Using base branch: ${base}`);

    if (doPullRequest) {
      // Push to user-specified branch
      const head = core.getInput("pr-branch", { required: true });
      core.debug(`Creating new branch "${head}"`);
      await git.branch([head]).checkout(head);

      core.debug(`Updating file locally & committing to ${head}`);
      await fs.writeFile(path, updatedContent);
      await git.commit("Update status badges", path);

      core.debug(`Running "git push --set-upstream origin ${head}"`);
      await git.push(["-f", "--set-upstream", "origin", `${head}`]);

      const pullRequest = {
        ...context.repo,
        head,
        base,
        title: "Update status badges",
        maintainer_can_modify: true,
      };
      core.debug(`Creating pull request: ${JSON.stringify(pullRequest)}`);
      try {
        await octokit.rest.pulls.create(pullRequest);
      } catch (err) {
        if (err.status === 422) {
          core.warning(
            `Validation error creating new PR (existing PRs will be force pushed to): ${err.message}`
          );
        } else {
          throw err;
        }
      }
    } else {
      core.debug("Updating file locally & committing to the main branch");
      await fs.writeFile(path, updatedContent);
      await git
        .commit("Update status badges", path)
        .pull(undefined, undefined, ["--rebase"])
        .push("origin", base);
    }
  } else {
    core.info("All badges were found to be up-to-date");
  }
};

main().catch((err) => core.setFailed(err.message));
