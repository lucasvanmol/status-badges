import nock from "nock";

export default function setup(globalConfig, projectConfig) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const params = new URLSearchParams({ per_page: 1 });
  nock("https://api.github.com")
    .get("/repos/test-owner/inactive-repo/commits")
    .query(params)
    .reply(200, [
      {
        sha: "22fc906bc1b36c804b94c45c5f328354bc96a821",
        node_id:
          "C_kwDOGg7AJdoAKDIyZmM5MDZiYzFiMzZjODA0Yjk0YzQ1YzVmMzI4MzU0YmM5NmE4MjE",
        commit: {
          author: {
            name: "test-owner",
            email: "test-owner@email.com",
            date: oneYearAgo.toISOString(),
          },
          committer: {
            name: "GitHub",
            email: "noreply@github.com",
            date: oneYearAgo.toISOString(),
          },
          message: "Update README.md",
          tree: {
            sha: "c1b2f53eb8f978094e25101a6aa98a22ccb37376",
            url: "https://api.github.com/repos/test-owner/inactive-repo/git/trees/c1b2f53eb8f978094e25101a6aa98a22ccb37376",
          },
          url: "https://api.github.com/repos/test-owner/inactive-repo/git/commits/22fc906bc1b36c804b94c45c5f328354bc96a821",
          comment_count: 0,
          verification: {},
        },
        url: "https://api.github.com/repos/test-owner/inactive-repo/commits/22fc906bc1b36c804b94c45c5f328354bc96a821",
        html_url:
          "https://github.com/test-owner/inactive-repo/commit/22fc906bc1b36c804b94c45c5f328354bc96a821",
        comments_url:
          "https://api.github.com/repos/test-owner/inactive-repo/commits/22fc906bc1b36c804b94c45c5f328354bc96a821/comments",
        author: {},
        committer: {},
        parents: [
          {
            sha: "d61ec09e291692ff1c78833f28db872a702da25e",
            url: "https://api.github.com/repos/test-owner/inactive-repo/commits/d61ec09e291692ff1c78833f28db872a702da25e",
            html_url:
              "https://github.com/test-owner/inactive-repo/commit/d61ec09e291692ff1c78833f28db872a702da25e",
          },
        ],
      },
    ])
    .persist();

  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getDate() - 2);

  nock("https://api.github.com")
    .get("/repos/test-owner/stale-repo/commits")
    .query(params)
    .reply(200, [
      {
        sha: "22fc906bc1b36c804b94c45c5f328354bc96a821",
        node_id:
          "C_kwDOGg7AJdoAKDIyZmM5MDZiYzFiMzZjODA0Yjk0YzQ1YzVmMzI4MzU0YmM5NmE4MjE",
        commit: {
          author: {
            name: "test-owner",
            email: "test-owner@email.com",
            date: twoMonthsAgo.toISOString(),
          },
          committer: {
            name: "GitHub",
            email: "noreply@github.com",
            date: twoMonthsAgo.toISOString(),
          },
          message: "Update README.md",
          tree: {
            sha: "c1b2f53eb8f978094e25101a6aa98a22ccb37376",
            url: "https://api.github.com/repos/test-owner/stale-repo/git/trees/c1b2f53eb8f978094e25101a6aa98a22ccb37376",
          },
          url: "https://api.github.com/repos/test-owner/stale-repo/git/commits/22fc906bc1b36c804b94c45c5f328354bc96a821",
          comment_count: 0,
          verification: {},
        },
        url: "https://api.github.com/repos/test-owner/stale-repo/commits/22fc906bc1b36c804b94c45c5f328354bc96a821",
        html_url:
          "https://github.com/test-owner/stale-repo/commit/22fc906bc1b36c804b94c45c5f328354bc96a821",
        comments_url:
          "https://api.github.com/repos/test-owner/stale-repo/commits/22fc906bc1b36c804b94c45c5f328354bc96a821/comments",
        author: {},
        committer: {},
        parents: [
          {
            sha: "d61ec09e291692ff1c78833f28db872a702da25e",
            url: "https://api.github.com/repos/test-owner/stale-repo/commits/d61ec09e291692ff1c78833f28db872a702da25e",
            html_url:
              "https://github.com/test-owner/stale-repo/commit/d61ec09e291692ff1c78833f28db872a702da25e",
          },
        ],
      },
    ])
    .persist();

    const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  nock("https://api.github.com")
    .get("/repos/test-owner/active-repo/commits")
    .query(params)
    .reply(200, [
      {
        sha: "22fc906bc1b36c804b94c45c5f328354bc96a821",
        node_id:
          "C_kwDOGg7AJdoAKDIyZmM5MDZiYzFiMzZjODA0Yjk0YzQ1YzVmMzI4MzU0YmM5NmE4MjE",
        commit: {
          author: {
            name: "test-owner",
            email: "test-owner@email.com",
            date: oneDayAgo.toISOString(),
          },
          committer: {
            name: "GitHub",
            email: "noreply@github.com",
            date: oneDayAgo.toISOString(),
          },
          message: "Update README.md",
          tree: {
            sha: "c1b2f53eb8f978094e25101a6aa98a22ccb37376",
            url: "https://api.github.com/repos/test-owner/active-repo/git/trees/c1b2f53eb8f978094e25101a6aa98a22ccb37376",
          },
          url: "https://api.github.com/repos/test-owner/active-repo/git/commits/22fc906bc1b36c804b94c45c5f328354bc96a821",
          comment_count: 0,
          verification: {},
        },
        url: "https://api.github.com/repos/test-owner/active-repo/commits/22fc906bc1b36c804b94c45c5f328354bc96a821",
        html_url:
          "https://github.com/test-owner/active-repo/commit/22fc906bc1b36c804b94c45c5f328354bc96a821",
        comments_url:
          "https://api.github.com/repos/test-owner/active-repo/commits/22fc906bc1b36c804b94c45c5f328354bc96a821/comments",
        author: {},
        committer: {},
        parents: [
          {
            sha: "d61ec09e291692ff1c78833f28db872a702da25e",
            url: "https://api.github.com/repos/test-owner/active-repo/commits/d61ec09e291692ff1c78833f28db872a702da25e",
            html_url:
              "https://github.com/test-owner/active-repo/commit/d61ec09e291692ff1c78833f28db872a702da25e",
          },
        ],
      },
    ])
    .persist();
}
