import core from "@actions/core";
import replaceAsync from "string-replace-async";

/**
 * Get the last commit date of a given repo
 * @param   {octokit} octokit   An authenticated Github Octokit client https://github.com/octokit/octokit.js
 * @param   {string}  owner     The owner of the repo
 * @param   {string}  repo      The name of the repo
 * @returns {Date}              The date of the last commit
 */
export async function getLastCommitDate(octokit, owner, repo) {
  const req = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
    per_page: 1,
  });
  return new Date(req.data[0].commit.committer.date);
}

/**
 * Given a date and a string in the form "x day/week/month/year(s)", subtract that duration from the date
 * @param   {Date}      originDate      Date to start with
 * @param   {string}    durationString  Number of days/weeks/months/years to substract. Must be a string that matches `/^(\d+) (day|week|month|year)s?$/`
 * @param   {string}    parameterName   The name of the parameter, for debug logging
 * @returns {Date}                      The originDate minus the duration specified by durationString
 */
export function subtractDurationFromDate(
  originDate,
  durationString,
  parameterName = undefined
) {
  const regex = /^(\d+) (day|week|month|year)s?$/;
  const newDate = new Date(originDate.getTime());

  let match = durationString.match(regex);
  if (!match) {
    throw Error(
      `${
        parameterName ? `The parameter ${parameterName}, which was set to ` : ""
      }'${durationString}' should match ${regex}`
    );
  } else {
    switch (match[2]) {
      case "day":
        newDate.setDate(newDate.getDate() - match[1]);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - match[1] * 7);
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() - match[1]);
        break;
      case "year":
        newDate.setFullYear(newDate.getFullYear() - match[1]);
        break;
      default:
        // unreachable
        throw Error(`Unexpected error parsing regex`);
    }
  }
  return newDate;
}

/**
 * Finds all github links in a text, and places/updates badges next to ones that have `<!-- STATUS_BADGE -->` next to them
 * @param   {octokit}   octokit     An authenticated Github Octokit client
 * @param   {string}    text        The text to parse and update
 * @param   {*}         config      Configuration for emojis and dates to use
 * @param   {bool}      findAll     If true, every github link will get a badge placed, regardless of `<!-- STATUS_BADGE -->` being present, UNLESS `<!-- NO_STATUS_BADGE -->` is present
 * @returns {string}                The text with updated badges
 */
export async function findAndPlaceBadges(
  octokit,
  text,
  config,
  findAll = false
) {
  const emojis = [
    config.activeEmoji,
    config.staleEmoji,
    config.inactiveEmoji,
    config.notFoundEmoji,
  ];

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
  //        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ MATCH
  //
  // prettier-ignore
  const badgeRegex = new RegExp(
    `(?<baseUrl>https?:\\/\\/github\\.com\\/(?<owner>[\\w,\\-,\\.]+)\\/(?<repo>[\\w,\\-,\\.]+))(?<tail>(?:[\\/,#][\\w,\\-,\\.,\\/,\\#]*)?\\)?)? *(?<emoji>${emojis.join("|")})? *(?=<!\\-\\- *STATUS_BADGE *\\-\\->)`,
    "g"
  );

  //                      owner   repo                                            badge
  //                        |      |                                                |
  //                    --------- ----                                   ------------------------
  // https://github.com/rust-lang/rust/blob/master/README.md#quick-start <!-- NO_STATUS_BADGE -->
  // ---------------------------------
  //                 |                ---------------------------------- tail
  //                url
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ MATCH
  //
  // prettier-ignore
  const findAllRegex = new RegExp(
    `(?<baseUrl>https?:\\/\\/github\\.com\\/(?<owner>[\\w,\\-,\\.]+)\\/(?<repo>[\\w,\\-,\\.]+))(?<tail>(?:[\\/,#][\\w,\\-,\\.,\\/,\\#]*)?\\)?)? *(?<emoji>${emojis.join("|")})? *(?<badge><!\\-\\- *NO_STATUS_BADGE *\\-\\->)?`,
    "g"
  );

  let regex;
  if (findAll) {
    regex = findAllRegex;
  } else {
    regex = badgeRegex;
  }

  const updatedContent = await replaceAsync(
    text,
    regex,
    async (match, baseUrl, owner, repo, tail, _emoji, badge) => {
      // Don't replace anything with matches that have the `<-- NO_STATUS_BADGE -->` tag in findAll mode
      if (badge && findAll) {
        core.debug(`Ignoring match: "${match}"`);
        return match;
      }

      let emoji = config.notFoundEmoji;
      try {
        const lastCommitDate = await getLastCommitDate(octokit, owner, repo);

        // Determine status
        if (lastCommitDate < config.inactiveDate) {
          emoji = config.inactiveEmoji;
        } else if (lastCommitDate < config.staleDate) {
          emoji = config.staleEmoji;
        } else {
          emoji = config.activeEmoji;
        }
      } catch (err) {
        console.log(err);
        if (err.status === 404) {
          core.warning(
            `Could not find repo https://github.com/${owner}/${repo}: ${err}`
          );
        } else if (err.status === 403 && err.message.includes("rate limit")) {
          const ratelimitRestSeconds = parseInt(
            err.response.headers["x-ratelimit-reset"]
          );
          const ratelimitReset = new Date(ratelimitRestSeconds * 1000);
          throw Error(
            `Rate limit error: ${err}. Your rate limit will reset on ${ratelimitReset}`
          );
        } else {
          throw err;
        }
      }

      core.debug(`Found repo link: ${baseUrl}, setting status to ${emoji}`);
      return `${baseUrl}${tail ? tail : ""} ${emoji}`;
    }
  );

  return updatedContent;
}
