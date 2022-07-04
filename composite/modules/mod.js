/**
 * Get the last commit date of a given repo
 * @param   {octokit} octokit   An authenticated Github Octokit client https://github.com/octokit/octokit.js
 * @param   {string}  owner     The owner of the repo
 * @param   {string}  repo      The name of the repo
 * @returns {Date}              The date of the last commit
 */
export async function getLastCommitDate(octokit, owner, repo) {
    const req = await octokit.request('GET /repos/{owner}/{repo}/commits', {
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
 * @returns {Date}                      The originDate minus the duration specified by durationString
 */
export function subtractDurationFromDate(originDate, durationString) {
    const regex = /^(\d+) (day|week|month|year)s?$/;
    const newDate = new Date(originDate.getTime());

    let match = durationString.match(regex);
    if (!match) {
        throw Error(`The parameter "${durationString}" should match ${regex}`)
    } else {
        switch (match[2]) {
            case 'day':
                newDate.setDate(newDate.getDate() - match[1]);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() - match[1] * 7);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() - match[1]);
                break;
            case 'year':
                newDate.setFullYear(newDate.getFullYear() - match[1]);
                break;
            default:
                // unreachable
                throw Error(`Unexpected error parsing regex`);
        }
    }
    return newDate;
}
