# Development

## Testing

### Install dependencies

```
npm install
```

### Run tests

First setup a github PAT with read permissions and add it to `.env`:

```
GITHUB_AUTH_TOKEN=ghp_abc123abc123abc123 > .env
```

Then run tests with 

```
npm run test
```

Note that requests to the github API are not mocked (yet?), so an internet connection is required, and some assumptions are made about the statuses of the repos that are queried.

## Building

First install ncc

```
npm i -g @vercel/ncc
```

Then build with

```
npm run build
```

which will compile all the code and modules into `dist/index.js`