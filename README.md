
---
# Chess Insights

A backend-driven system for ingesting, processing, and analyzing chess games with structured performance insights.

## Overview

Chess Insights focuses on backend logic and analysis pipelines that transform raw chess game data into structured feedback suitable for downstream consumption.

A web interface is used for visualization, but the core of the project is data processing and analysis.

## Core Capabilities

- PGN ingestion and persistent storage
- Move-by-move game parsing
- Structured annotations on positions
- Engine-assisted position evaluation
- Searchable and filterable game collection

## Architecture

- Backend: Node.js, Express, MongoDB
- Frontend: React
- Analysis Engine: Stockfish

## Example API Response

```json
{
  "gameId": "64f1c9a2",
  "summary": {
    "accuracy": 82,
    "blunders": 1,
    "mistakes": 3
  },
  "keyMoments": [
    {
      "move": 17,
      "evaluation": "-2.1",
      "comment": "Missed tactical defense"
    }
  ]
}
```
