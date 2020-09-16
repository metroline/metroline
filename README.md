<p align="center">
  <img alt="Metroline Logo" src="https://raw.githubusercontent.com/metroline/metroline-brand/master/metroline-logo.svg" width="100" />
</p>
<h1 align="center">
  Metroline
</h1>

Open Source Continuous Integration and Delivery platform built with Docker, NodeJS, React, D3 and Socket.io.

> Found a security issue ? Please [let us know](https://github.com/metroline/metroline/security/advisories/new) !

## Links

- [Demo (that builds this Repo - it's Metroline-ception !)](https://demo.metroline.io)
- [Docs](https://docs.metroline.io)
- [Blog](https://blog.metroline.io)
- [Official website](https://metroline.io)
- [Roadmap](https://github.com/metroline/metroline/projects/1)

## Features

- supports multi-runner (multi-machine not supported yet)
- use docker images for jobs
- define docker images at the job level or globally
- branch conditions
- status conditions
- shared workspace, no artifact headache
- secret masking in logs ([best effort](#))
- compatible with Gitlab (support subgroups), Gitea (coming soon: Github, Bitbucket, Gogs)
- easy install with Docker and Docker Compose
- model complex workflows (we haven't yet implemented workspace merging)
- define secrets at the repo level or globally
- restrict secrets to protected branches
- restrict secrets to specific branches

## Why we wrote Metroline

We wrote Metroline because:
- Gitlab CI secret masking doesn't support short or multiline secrets (but we acknowledge that it's not an easy task) even though a "best effort" strategy could be taken [[source](https://docs.gitlab.com/ee/ci/variables/#masked-variable-requirements)]
- Gitlab CI cache can be unexpected, to the point where we've sometimes had to artifact `node_modules`, even though we used per-branch, per-repo cache keys (`$CI_PROJECT_ID-$CI_BUILD_REF_NAME`)
- Gitlab CI is slow with pipelines that use cache/artifacts because it has to copy them between jobs
- Drone CI doesn't support Gitlab subgroups [[source](https://github.com/drone/drone/issues/2009)]
- CircleCI is not self hosted
- Github Actions is not open source and cannot be self-hosted
- TravisCI installation seems difficult with docker-compose, and we're not huge fans of the syntax, but it's open source 👍
- Getting a feature request implemented is merely impossible or takes months in existing solutions 😞
- ... it's A LOT of fun, and really cool :)

> If you're using Metroline and would like to add something to this list, feel free to make a PR !

## Roadmap

We're looking for help in the first place to **write tests**. We know it's boring, but this would help us stabilize the current version of Metroline.

Our roadmap is available [here](https://github.com/metroline/metroline/projects/1).

## Development

### Using Gitea

1. Run `docker-compose -f ./docker-compose-dev.yml up -d`.
1. Configure Gitea
1. Run `docker-compose -f ./docker-compose-dev.yml down`.
1. Edit `./data/gitea/gitea/conf/app.ini`:
    ```
    DOMAIN           = <your-ip>
    SSH_DOMAIN       = <your-ip>
    ROOT_URL         = http://<your-ip>:3003/
    SSH_PORT         = 222
    ```
1. Run `docker-compose -f ./docker-compose-dev.yml up -d`.

This way, URLs in webhook commits will allow proper clones from inside a Docker container (see [limitations](https://docs.metroline.io/core/limitations#localhost)).

### Using Github

1. Start a tunnel to your local Metroline server with `ngrok http 3001`.
1. Create an OAuth app and change the Client ID and Client Secret. Make sure to set the callback URL to the HTTPS url provided by Ngrok.
1. In your `.server.env`, set cookie settings so that Chrome allows cross-site requests with your Metroline auth cookie:
```..env
METROLINE_COOKIE_SAMESITE=None
METROLINE_COOKIE_SECURE=true
```

### SSL

Use [`mkcert`](https://github.com/FiloSottile/mkcert) to generate a certificate and key:

```shell script
brew install mkcert nss
mkcert -install
mkcert localhost
```

then update your `.env` with:

```
METROLINE_SSL_KEY=localhost-key.pem
METROLINE_SSL_CERT=localhost.pem
```

For runners to register properly, you need to set `NODE_EXTRA_CA_CERTS` to the path of `mkcert`'s root CA (which should be in the directory printed in your console when running `mkcert -install` - you can always re-run this command). Make sure `NODE_EXTRA_CA_CERTS` is set prior to running `npm start`, otherwise it won't work.
