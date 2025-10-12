---
title: Speed Up Your CI Pipeline
slug: speed-up-ci
date: 2024-01-15
tags:
  - devops
  - ci
---

Continuous integration is only valuable when feedback is fast. Here are a few tactics that have helped teams shorten their pipelines.

### Cache Dependencies Aggressively

Store package caches between builds. Whether you use npm, pnpm, or yarn, caching dependencies can shave minutes from every run.

### Split Long Jobs

Break monolithic jobs into stages that can run in parallel. For example, linting, unit tests, and integration tests can often run simultaneously.

### Use Targeted Triggers

Avoid running the entire pipeline on documentation-only changes. Path filters in GitHub Actions and other CI platforms make this easy.
