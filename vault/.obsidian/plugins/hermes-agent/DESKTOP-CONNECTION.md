# Hermes Agent — Desktop connection recovery

## Current diagnosis

- Hermes Desktop and its gateway service are running on this Windows machine.
- `http://127.0.0.1:8642/health` returns HTTP 200, so the local gateway process is reachable.
- Authenticated API requests to `/v1/models` return HTTP 401 when no key is supplied.
- The Obsidian plugin's actual settings are stored by Obsidian through `loadData()` / `saveData()` in each vault's `data.json`; the repo's legacy `config.json` is not the active settings source.
- Two registered vaults with this plugin have an empty `apiKey`. The currently open vault may be a different Obsidian profile/vault, so check the actual vault where you use the plugin.
- The gateway has an `API_SERVER_KEY` configured in a Hermes profile, but do not assume the default profile's key matches the running Desktop gateway. Use the active profile shown by Hermes Desktop.
- No key is stored in or should be committed to this repository.

## Fix the desktop connection

1. In the Obsidian vault where you open Hermes Agent, go to **Settings → Community plugins → Hermes Agent → Options**.
2. Set **Gateway base URL** to `http://127.0.0.1:8642` for a local Hermes Desktop gateway.
3. In Hermes Desktop, identify the active profile. Retrieve that profile's `API_SERVER_KEY` locally from its `.env` file; never paste it into chat, source files, or this repository.
4. Paste the matching value into **API key (API_SERVER_KEY)**. This field is saved by Obsidian as a password-style setting.
5. Click **Test connection**. Success should list available models. If it still returns 401, the key belongs to a different profile or the gateway needs a restart after profile/key changes.

## Safe local diagnostic

Run this from PowerShell in the project directory to check gateway health and whether registered Obsidian vaults have a key configured. It never prints the key value:

```powershell
.\vault\.obsidian\plugins\hermes-agent\check-desktop-connection.ps1
```

## Remote endpoint

The remote `https://agent.esggo.co` previously returned Cloudflare 530 / error 1033, the VPS direct endpoint `http://161.118.248.180:8786/health` timed out, and `app.esggo.co` did not resolve. Use the local URL for desktop until the remote tunnel/backend is restored.
