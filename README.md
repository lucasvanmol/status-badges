# Status Badge Action

Place status badges as emojis next to repo links marked with `<!-- STATUS_BADGE -->`

<!-- There is a zero-width space (​) in every link in the markdown examples in order to not trigger the bot. They can be viewed as red dots using "view raw" on github -->

| Markdown | Result | 
|:-|:-|
| `See the [rust repo](https://github.com/rust-lang/rus​t) <!-- STATUS_BADGE -->` | See the [rust repo](https://github.com/rust-lang/rust) :green_circle: <!-- STATUS_BADGE --> |

See [Examples](#examples) for more examples. Be weary of copying the links in the markdown examples, as they contain hidden zero-width spaces in order to not trigger the bot.

## Required Inputs

### `path`

**Required**: Path of the file to parse and create/update status badges for.

### `token`

**Required**: Github token for making request to other (public) repos, and pushing status badge updates to your repo. You can use `${{ secrets.GITHUB_TOKEN }}`.

### Optional Inputs

See [Customization](#customization)

## Usage

Example workflow file that updates status badges every 24 hours found inside `README.md`, or whenever the file is updated on push. `on: workflow_dispatch` also allows you to run the workflow manually as needed.

Note that the `actions/checkout` step is required. 

```yaml
name: update-status-badges
on:
  schedule:
    - cron: '0 0 * * *'
  push:
    paths:
      - 'README.md'
  workflow_dispatch:

jobs:
  status_badges:
    runs-on: ubuntu-latest
    name: Update status badges
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Check and update badges
        uses: lucasvanmol/status-badge-action@v1
        with:
          path: 'README.md'
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Customization

Certain inputs are optional arguments to customize emojis to use and determine from what time period repos are considered stale or inactive

| Input | Description | Default | 
|-------|-------------|---------|
| `stale-timeout` | The amount of time required before a repo is marked as stale. Must match `/^(\d+) (day\|week\|month\|year)s?$/`. | `1 month` |
| `inactive-timeout` | The amount of time required before a repo is marked as inactive. Must match `/^(\d+) (day\|week\|month\|year)s?$/`. | `3 months` |
| `active-emoji` | The emoji to use for active repos. | :green_circle: |
| `stale-emoji` | The emoji to use for stale repos. | :yellow_circle: |
| `inactive-emoji` | The emoji to use for inactive repos. | :red_circle: |
| `not-found-emoji` | The emoji to use for repos that weren't found. | :grey_question: |


## Examples


| Markdown | Result | 
|-|-|
| `https://github.com/rust-lang/rus​t <!-- STATUS_BADGE -->` | https://github.com/rust-lang/rust :green_circle: <!-- STATUS_BADGE --> |
| `[Inactive Repo](https://github.com/lucasvanmol/barnes-hut-benc​h) <!-- STATUS_BADGE -->` | [Inactive Repo](https://github.com/lucasvanmol/barnes-hut-bench) :red_circle: <!-- STATUS_BADGE --> |
| `https://github.com/lucasvanmol/this-repo-does-not-exis​t <!-- STATUS_BADGE -->` | https://github.com/lucasvanmol/this-repo-does-not-exist :grey_question: <!-- STATUS_BADGE --> |
