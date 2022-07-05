import 'dotenv/config';
import github from "@actions/github";
import { getLastCommitDate, subtractDurationFromDate } from './mod';

// TODO: Mock github API with `nock`

describe('getLastCommitDate', () => {
    const octokit = github.getOctokit(process.env.GITHUB_AUTH_TOKEN);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    test('active repo is detected', async () => {
        const owner = 'rust-lang';
        const repo = 'rust';
        const date = await getLastCommitDate(octokit, owner, repo);
        expect(date > threeMonthsAgo).toBeTruthy();
    });

    test('inactive repo is detected', async () => {
        const owner = 'lucasvanmol';
        const repo = 'barnes-hut-bench';
        const date = await getLastCommitDate(octokit, owner, repo);
        expect(date > threeMonthsAgo).toBeFalsy();
    });
});

describe('subtractDurationFromDate', () => {
    const originDate = new Date(2000, 1, 8);
    test('can subtract 12 days', () => {
        const newDate = subtractDurationFromDate(originDate, "12 days");
        expect(newDate).toEqual(new Date(2000, 0, 27));
    });

    test('can subtract a week', () => {
        const newDate = subtractDurationFromDate(originDate, "1 week");
        expect(newDate).toEqual(new Date(2000, 1, 1));
    });

    test('can subtract 2 months', () => {
        const newDate = subtractDurationFromDate(originDate, "2 months");
        expect(newDate).toEqual(new Date(1999, 11, 8));
    });

    test('can subtract a year', () => {
        const newDate = subtractDurationFromDate(originDate, "1 year");
        expect(newDate).toEqual(new Date(1999, 1, 8));
    });

    test('should throw on bad inputs', () => {
        expect(() => { subtractDurationFromDate(originDate, "asdlk"); }).toThrow(Error);
        expect(() => { subtractDurationFromDate(originDate, "1.2 months"); }).toThrow(Error);
    });
});