# Scripts

This folder contains command-line entry scripts for the analytics side of the project.

- `run_pipeline.py` is the main offline pipeline entrypoint

It loads trade data, runs the requested analysis phases, and writes outputs into `data/processed/` and `artifacts/`.
