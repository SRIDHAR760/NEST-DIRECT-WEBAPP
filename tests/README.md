# NestDirect — Test & CI Suite

This directory + `.github/workflows/` implements automated testing across
5 GitHub Actions workflows: **Build**, **Vulnerability Scan**, **Selenium**,
**Appium**, and **Load Test**.

## Honest scope notes — please read before assuming numbers

**On "300–400 test cases":** a genuinely useful test suite is sized to what
the app actually does, not to a target number. Padding a suite with
duplicate or trivial assertions to hit a headline count makes it *less*
trustworthy, not more — failures get ignored, CI gets slow, and real bugs
hide in the noise. What's here instead:

- **Selenium: 67 real, parametrized test cases** (verified via
  `pytest --collect-only`), covering landing page, auth validation
  (7 invalid emails × 2 forms, 5 weak passwords), search across all
  6 real localities, bedroom filters, property cards, favorites, compare,
  and responsive layout across 5 real device viewports.
- **Appium: ~13 test cases** covering the highest-value mobile-browser
  touch flows. Appium is built for native apps; since NestDirect is a web
  app, this suite drives real mobile Chrome via Appium's UiAutomator2
  driver on an Android emulator — correct usage, but inherently smaller
  and slower than the desktop Selenium suite.
- **Vulnerability testing** is *not* hand-written test cases at all — see
  below for why.
- **Load testing** uses k6 scenarios (smoke/average/stress/spike), not
  discrete "test cases" — load testing is inherently about traffic
  patterns and thresholds, not pass/fail assertions per case.

If you genuinely want 300-400 Selenium/Appium cases, the honest way to get
there is expanding the parametrized data sets (e.g. testing every single
property in your dataset individually, every combination of filters
together, every form field's boundary values) — happy to keep extending
this incrementally as the app grows, rather than manufacturing filler now.

## Why vulnerability testing uses scanners, not custom test cases

Security testing is not implemented as example-based unit tests here,
deliberately. Real vulnerability coverage comes from tools that each run
hundreds of vetted checks against known CVE databases and attack patterns
— reinventing that by hand would be both less thorough and less trustworthy:

| Tool | What it checks |
|---|---|
| `npm audit` | Known CVEs in your dependency tree |
| CodeQL | GitHub's static analysis (SAST) — large built-in query suite for JS/TS |
| Gitleaks | Scans git history for committed secrets/API keys |
| OWASP ZAP Baseline | Passive DAST scan of the live site — OWASP Top 10, missing security headers, exposed info |

## Directory structure

```
.github/workflows/
  build.yml              — type-check + vite build on every push/PR
  security-scan.yml       — the 4 scanners above, on push/PR + weekly schedule
  selenium-tests.yml      — 67 Selenium tests, on push/PR + daily schedule
  appium-tests.yml        — Appium mobile tests, weekly (slower, emulator-based)
  load-test.yml           — k6 load test, weekly (manually triggerable anytime)

tests/
  selenium/                — pytest + Selenium, run with: pytest -v
  appium/                  — pytest + Appium, requires Appium server + Android emulator
  load/load-test.js        — k6 script, run with: k6 run tests/load/load-test.js
```

## ⚠️ Before enabling the load test's API scenario
`tests/load/load-test.js` includes an `api_load` scenario that hits
`/api/chat` (your real Gemini key). It is OFF by default and only runs if
you explicitly pass `INCLUDE_API_LOAD=true`. Given you're already hitting
Gemini's free-tier quota from manual testing, do not enable this until
you've enabled billing on the Gemini API project — otherwise it will burn
your daily quota in seconds.

## Running locally

```bash
# Selenium
cd tests/selenium && pip install -r requirements.txt && pytest -v

# k6 (safe scenarios only)
k6 run tests/load/load-test.js

# Appium (requires Appium server running + Android emulator/device connected)
cd tests/appium && pip install -r requirements.txt && pytest -v
```

## Adding a build status badge to your GitHub README

```markdown
![Build](https://github.com/SRIDHAR760/NEST-DIRECT-WEBAPP/actions/workflows/build.yml/badge.svg)
![Security Scan](https://github.com/SRIDHAR760/NEST-DIRECT-WEBAPP/actions/workflows/security-scan.yml/badge.svg)
![Selenium Tests](https://github.com/SRIDHAR760/NEST-DIRECT-WEBAPP/actions/workflows/selenium-tests.yml/badge.svg)
```
