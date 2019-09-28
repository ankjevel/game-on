# game-on (working title)

This is the backend for (for now) a poker frontend.

It's just a side-project (that never seems to be done) for handling a turn based
game with multiple users.

The server exposes a REST- and Websocket-interface. Every call should be queued
on a message-implementation with some help from redis (share workload between
servers and not storing all in memory).

## how to run

```sh
docker-compose up -d # to get a redis-backend running

nvm use # to run the correct node version
# else check .nvmrc to see required node version
npm i # or `npm ci` to install required `node modules`
npm run dev # to run the dev-server
npm test # to run tests
```

If you need to update the configuration (check `src/config.ts` for defaults)
add then to a `config.json` in the root.

For example; to change the default server-port to `1337`, add this to a `config.json`-file:

```json
{
  "express": {
    "port": 1337
  }
}
```

... or use `env`:

```sh
EXPRESS__PORT=1337 npm run dev
```
