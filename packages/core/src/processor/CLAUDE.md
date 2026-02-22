# Processor Module

## Purpose

Orchestrates the complete component processing pipeline, coordinating HybridExtractor, MetaGenerator, and ManifestBuilder into a unified workflow. The problem: consumers need both all-in-one convenience and step-by-step control for different use cases (CLI tools vs incremental processing). The solution: dual API providing full pipeline processing and atomic operations.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ComponentProcessor                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Mode 1: Full Pipeline (process)                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │ Extract  │ → │ Generate │ → │  Build   │ → Result          │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                                                  │
│  Mode 2: Atomic Operations                                      │
│  ┌──────────┐                                                   │
│  │ Extract  │ → ExtractResult (use later)                       │
│  └──────────┘                                                   │
│  ┌──────────┐                                                   │
│  │ Generate │ → GenerateResult (use later)                      │
│  └──────────┘                                                   │
│  ┌──────────┐                                                   │
│  │  Build   │ → BuildResult (final)                             │
│  └──────────┘                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

| Component              | Role                                          |
| ---------------------- | --------------------------------------------- |
| **ComponentProcessor** | Main orchestrator providing dual API          |
| **process()**          | Full pipeline: extract → generate → build     |
| **extract()**          | Atomic: extraction only                       |
| **generate()**         | Atomic: generation only (requires extraction) |
| **build()**            | Atomic: manifest build (requires both)        |

## Design Decisions

| Decision                         | Rationale                                                                  |
| -------------------------------- | -------------------------------------------------------------------------- |
| **Dual API (full + atomic)**     | CLI tools need all-in-one; incremental pipelines need step-by-step control |
| **In-memory only**               | No built-in persistence; consumers write JSON or store in DB as needed     |
| **Throw on error**               | Simplifies consumer code — no discriminated unions to check                |
| **Factory function convenience** | createComponentProcessor() with sensible defaults for simple use cases     |
| **Framework validation**         | Only React supported currently; explicit validation with clear error       |
| **No result caching**            | Each call re-executes; consumers are responsible for caching if needed     |

## Two Usage Modes

**Mode 1: Full Pipeline**

- Single call: process(input) → result
- Runs extraction → generation → build in sequence
- Returns combined result with all metadata

**Mode 2: Atomic Operations**

- Separate calls: extract() → generate() → build()
- Fine-grained control over each phase
- Can cache or modify intermediate results
- Must call in order (dependencies)

## How It Fits in the Pipeline

**Input:** Component source code, name, framework, optional stories
**Output:** ProcessorResult with manifest, metadata, extraction info
**End consumer:** Database storage, MCP server endpoints

The processor is the top-level orchestrator of the Context Engine pipeline. It coordinates all phases and provides the primary API for CLI tools, scripts, and server endpoints.

Consumers are responsible for persisting results — the script at `scripts/run-processor.ts` writes JSON files directly.

## Gotchas

- **Framework validation** — Only React supported; explicit validation throws if framework is not 'react'
- **Order matters for atomic** — Must call extract → generate → build; dependencies not enforced by types
- **No result caching** — Each call re-executes; callers are responsible for caching
- **Error throwing vs returning** — All methods throw on error; always use try-catch
- **hints are optional but valuable** — Providing hints significantly improves LLM output quality
- **availableComponents prevents hallucinations** — Passed per-request in process() or build() input, not at construction time; enables dynamic filtering based on the org's actual components at request time. Without it, LLM may generate non-existent related components

## When to Use

**Use process() when:**

- You need the full pipeline in one call
- You don't need intermediate results
- You're building CLI tools or simple scripts

**Use atomic operations when:**

- You need fine-grained control over each phase
- You want to batch extraction before generation
- You're implementing custom caching strategies
- You need to inspect intermediate results

**Use createComponentProcessor factory when:**

- You want sensible defaults with env-based configuration
- You're building one-off scripts
