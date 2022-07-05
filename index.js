import core from "@actions/core";
import github from "@actions/github";
import replaceAsync from "string-replace-async";
import { promises as fs } from "fs";
import { getLastCommitDate, subtractDurationFromDate } from "./modules/mod.js";
import { simpleGit } from "simple-git";

const main = async () => {
    const myToken = core.getInput('token');
    const octokit = github.getOctokit(myToken);
    const context = github.context;

    const path = core.getInput('path');
    const content = await fs.readFile(path, 'utf8');
    
    const staleDateInput = core.getInput('stale-timeout');
    const inactiveDateInput = core.getInput('inactive-timeout');

    const dateNow = new Date();
    const staleDate = subtractDurationFromDate(dateNow, staleDateInput, 'stale-timeout');
    const inactiveDate = subtractDurationFromDate(dateNow, inactiveDateInput, 'inactive-timeout');

    const notFoundEmoji = core.getInput('not-found-emoji');
    const inactiveEmoji = core.getInput('inactive-emoji');
    const staleEmoji = core.getInput('stale-emoji');
    const activeEmoji = core.getInput('active-emoji');

    // Example matches:
    //                      owner   repo     emoji
    //                        |      |         |
    //                    --------- ---- --------------
    // https://github.com/rust-lang/rust :green_circle: <!-- STATUS_BADGE -->
    // --------------------------------- 
    //                 |
    //                baseUrl
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ MATCH
    //
    //
    //                             owner   repo
    //                               |      |
    //                           --------- ----
    // [Repo](https://github.com/rust-lang/rust/blob/master/README.md#quick-start) <!-- STATUS_BADGE -->
    //        ---------------------------------
    //                        |                ----------------------------------- tail
    //                      baseUrl
    //        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ MATCH
    //
    const badgeRegex   = /(?<baseUrl>https?:\/\/github\.com\/(?<owner>[\w,\-,\.]+)\/(?<repo>[\w,\-,\.]+))(?<tail>(?:[\/,#][\w,\-,\.,\/,\#]*)?\)?)? *(?<emoji>\:\w+\:)? *(?=<!\-\- *STATUS_BADGE *\-\->)/g;
    
    //                      owner   repo                                            badge
    //                        |      |                                                |
    //                    --------- ----                                   ------------------------
    // https://github.com/rust-lang/rust/blob/master/README.md#quick-start <!-- NO_STATUS_BADGE -->
    // ---------------------------------
    //                 |                ---------------------------------- tail
    //                url
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ MATCH 
    //
    const findAllRegex = /(?<baseUrl>https?:\/\/github\.com\/(?<owner>[\w,\-,\.]+)\/(?<repo>[\w,\-,\.]+))(?<tail>(?:[\/,#][\w,\-,\.,\/,\#]*)?\)?)? *(?<emoji>\:\w+\:)? *(?<badge><!\-\- *NO_STATUS_BADGE *\-\->)?/g;

    let regex;
    const findAllLinks = core.getInput('find-all-links');
    if (findAllLinks === 'true') {
        regex = findAllRegex;
    } else if (findAllLinks === 'false') {
        regex = badgeRegex;
    } else {
        throw Error("Parameter `find-all-links` must set to `true` or `false`")
    }

    const updatedContent = await replaceAsync(content, regex, async (match, baseUrl, owner, repo, tail, _emoji, badge) => {
        // Don't replace anything with matches that have the `<-- NO_STATUS_BADGE -->` tag in findAll mode
        if (badge && findAllLinks === 'true') {
            core.debug(`Ignoring match: "${match}"`);
            return match
        }

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

        core.debug(`Found repo: ${baseUrl}, setting status to ${emoji}`)
        return `${baseUrl}${tail ? `${tail}` : ""} ${emoji} `;
    });

    core.debug("\n---- OLD TEXT ----\n");
    core.debug(content);
    core.debug("\n---- NEW TEXT ----\n");
    core.debug(updatedContent);

    const doPullRequest = core.getInput('pull-request') === 'true';

    if (content !== updatedContent) {
        // Update the file content locally
        await fs.writeFile(path, updatedContent);
        
        // Commit changes
        const git = simpleGit()
        git.addConfig('user.name', 'github-actions[bot]')
            .addConfig('user.email', 'github-actions[bot]@users.noreply.github.com');
        
        const base = (await git.branchLocal()).current;

        if (doPullRequest) {
            // Push to user-specified branch
            const head = core.getInput('pr-branch');
            await git.checkout(head)
            git.commit("Update status badges", path);

            await git.pull(undefined, undefined, {'--rebase': 'true'});
            await git.push('origin', head);

            await octokit.rest.pulls.create({
                ...context.repo,
                head,
                base,
            });
        } else {
            // Commit directly to main branch
            git.commit("Update status badges", path);

            await git.pull(undefined, undefined, {'--rebase': 'true'});
            await git.push('origin', base);
        }
    } else {
        core.info("All badges were found to be up-to-date");
    }
}

main().catch(err => core.setFailed(err.message));
