import core from "@actions/core";
import github from "@actions/github";
import replaceAsync from "string-replace-async";
import { promises as fs } from "fs";
import { getLastCommitDate, subtractDurationFromDate } from "./modules/mod.js";

const main = async () => {
    const myToken = core.getInput('token');
    const octokit = github.getOctokit(myToken);

    const path = core.getInput('path');
    const content = await fs.readFile(path, 'utf8');
    
    const staleDateInput = core.getInput('stale-timeout');
    const inactiveDateInput = core.getInput('inactive-timeout');

    const dateNow = new Date();
    const staleDate = subtractDurationFromDate(dateNow, staleDateInput);
    const inactiveDate = subtractDurationFromDate(dateNow, inactiveDateInput);

    const notFoundEmoji = core.getInput('not-found-emoji');
    const inactiveEmoji = core.getInput('inactive-emoji');
    const staleEmoji = core.getInput('stale-emoji');
    const activeEmoji = core.getInput('active-emoji');


    // Example matches:
    //                      owner   repo
    //                        |      |
    //                    --------- ---- 
    // https://github.com/rust-lang/rust <!-- STATUS_BADGE -->
    // --------------------------------- 
    //                 |
    //                url
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ MATCH 1
    //
    //                             owner   repo      emoji
    //                               |      |          |
    //                           --------- ----  --------------
    // [Repo](https://github.com/rust-lang/rust) :green_circle: <!-- STATUS_BADGE -->
    //        ---------------------------------| 
    //                        |             bracket
    //                       url
    //        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ MATCH 2
    const urlRegex = /(?<url>https?:\/\/github\.com\/(?<owner>[\w,\-,\.]+)\/(?<repo>[\w,\-,\.]+)\/?) *(?<bracket>\))? *(?<emoji>\:\w+\:)? *(?=<!\-\- *STATUS_BADGE *\-\->)/g;

    const updatedContent = await replaceAsync(content, urlRegex, async (_match, url, owner, repo, bracket, _emoji) => {
        let emoji = notFoundEmoji;
        try {
            const lastCommitDate = await getLastCommitDate(octokit, owner, repo);
            
            // Determine status
            if (lastCommitDate < inactiveDate) {
                emoji = inactiveEmoji;
            } else if (lastCommitDate < staleDate) {
                emoji = staleEmoji;
            } else {
                emoji = activeEmoji;
            }
        } catch(err) {
            core.warning(`Error getting last commit date for repo https://github.com/${owner}/${repo}: ${err}`);
        }

        core.debug(`Found repo: ${url}, setting status to ${emoji}`)
        return `${url}${bracket ? `${bracket}` : ""} ${emoji} `;
    });

    core.debug("\n---- OLD TEXT ----\n");
    core.debug(content);
    core.debug("\n---- NEW TEXT ----\n");
    core.debug(updatedContent);

    await fs.writeFile(path, updatedContent);
}

main().catch(err => core.setFailed(err.message));
