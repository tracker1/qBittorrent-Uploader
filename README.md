# qBittorrent Uploader

Simple Deno application that will watch and upload .torrent files from a
specified watch directory ($HOME/Downloads by default) to the specified
qBittorrent server.

```
deno run -A main.ts
```

If calling `main.ts` directly, it expects a `.env` file in your current
directory.

## Docker Compose

There is a working `Dockerfile` and `docker-compose.yml` file for use with this
project.

- Copy `.env.sample` to `.env`
- edit `.env` to match your configuration.
- run `docker compose up -d`

## Environment Variables

The following environment variables are expected.

- `QB_URL` - URL to the qBittorrent server (`http://servername/`)
- `QB_USER` - Username to authenticate with
- `QB_PASS` - Passphrase to authenticate with
- `WATCH_DIR` (optional) - directory to watch (default: `$HOME/Downloads`)

## License

[MIT Licensed](LICENSE.md)
