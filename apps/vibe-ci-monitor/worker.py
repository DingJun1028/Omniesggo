"""Worker entrypoint for the Omniesggo CI monitor workflow."""

import asyncio

import mistralai.workflows as workflows

from ci_monitor import OmniesggoCiMonitorWorkflow


async def main() -> None:
    await workflows.run_worker([OmniesggoCiMonitorWorkflow])


if __name__ == "__main__":
    asyncio.run(main())
