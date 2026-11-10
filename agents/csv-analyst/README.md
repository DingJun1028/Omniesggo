# csv-analyst (agent: `omniesggo`)

A conversational data-analyst agent built with the Mistral Agents SDK
(`mistralai-agents`). You give it a link to a CSV file in your Google Drive and
ask questions in plain language; it answers with real numbers from your data.

- Retrieval uses your own Google Drive connection: the agent attaches the
  Studio connector `google_drive_mcp`, which acts as the user running the
  session (on-behalf-of), so the deployment is hardened.
- Analysis is limited to fixed, read-only tools — no arbitrary code execution:
  - `load_csv` — load the CSV downloaded via the Drive connector (base64) into
    the session's workspace (max 10 MB).
  - `dataset_info` — which file is loaded in this conversation (rows, columns, dtypes).
  - `describe_columns` — per-column dtype, nulls, distinct count, numeric stats or top values.
  - `preview_rows` — row preview with offset.
  - `filter_rows` — row filters (eq/ne/gt/gte/lt/lte/contains/not_contains/isin/not_isin/isnull/notnull, and/or).
  - `group_by_aggregate` — group-by with sum/mean/median/min/max/count/nunique/std, optional pre-filters, sorting, top-N.
- Multi-turn: sessions are stored by Mistral on the managed deployment, so
  follow-ups in the same conversation keep the full history and the loaded CSV
  stays in the session's workspace (in the worker, for the session's lifetime).

## Run locally

```bash
export MISTRAL_API_KEY=...   # your own key; never commit it
uv run agents info           # validate the entrypoint (no key needed)
uv run agents chat omniesggo
```

## Deploy (Mistral-managed)

The project is pushed to GitHub (subdirectory `agents/csv-analyst/` of the repo)
and deployed as a hardened managed deployment; Mistral builds the Dockerfile
from the pushed commit:

```bash
uv run --env-file .env agents deploy --name omniesggo
# or equivalently, a managed workflow deployment from the repo with
# build_directory = agents/csv-analyst and hardened = true
```

After deploy, chat with it in Vibe Code Web at
`https://chat.mistral.ai/managed-agents/omniesggo?source=agents_api`, or from
Vibe by selecting the `omniesggo` agent, or with `uv run agents chat omniesggo`.

## Tests

```bash
uv run python test_tools.py   # offline unit tests of the fixed tools, no API key
```
