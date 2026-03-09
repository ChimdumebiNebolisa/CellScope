# SPEC.md

## Overview

CellScope is a web-based battery diagnostics tool that analyzes measured battery data and returns clear, actionable results. Users can either upload a CSV file of battery readings or enter readings manually through the interface. The system processes the data, detects anomalies and threshold violations, computes summary metrics, and presents the results in a visual dashboard with charts, alerts, and an overall health summary.

CellScope is an analysis tool, not a simulator. It does not generate fake battery behavior or model battery dynamics from scratch. Its purpose is to inspect real measured readings and turn them into understandable diagnostics.

## Problem

Battery measurements by themselves are hard to interpret quickly and consistently. Raw lists of voltage, current, temperature, and timestamp values do not directly explain whether the battery stayed within safe limits, whether abnormal events occurred, or whether the dataset suggests stable or risky behavior.

Without a dedicated tool, users have to inspect rows manually and answer questions such as:

- Was the battery operating within safe limits?
- Were there abnormal voltage drops?
- Did temperature exceed acceptable thresholds?
- Does the dataset overall look stable, warning-level, or critical?

That process is slow, error-prone, and difficult to do well from raw readings alone.

## Target Users

CellScope is for users who want lightweight battery data inspection without building a full analysis pipeline themselves.

Primary users include:

- students working on electronics or power-related projects
- hobbyists collecting battery readings from hardware tests
- engineers who want a lightweight browser-based inspection tool
- reviewers or recruiters evaluating a project with clear technical reasoning

## Goal

The goal of CellScope is to provide a simple, accessible browser-based way to analyze measured battery readings and return results that are easy to understand.

The product should let a user:

- submit battery readings through CSV upload or manual entry
- validate and normalize the data before analysis
- compute useful summary metrics
- detect threshold violations and suspicious behavior
- smooth noisy data for clearer trend inspection
- identify abnormal voltage drops
- classify dataset health as Stable, Warning, or Critical
- view the results in a clean diagnostic dashboard
- optionally save data locally in the browser without requiring accounts

## Core Product Flow

The core product flow is:

**measured battery data in -> analysis engine -> diagnostic output**

A user provides battery readings. The system validates and analyzes them. The output is returned as a set of metrics, alerts, anomalies, charts, and an overall health classification.

## Inputs

CellScope supports two input methods.

### 1. CSV Upload

Users can upload a CSV file containing battery readings.

Required fields:

- timestamp
- voltage
- current
- temperature

The system must validate the schema and reject malformed data before analysis.

### 2. Manual Entry

Users can enter readings manually through an editable table in the web interface.

Each row includes:

- timestamp
- voltage
- current
- temperature

Users must be able to add, edit, and delete rows before running analysis.

## Expected Capabilities

### Data Validation

The product must:

- confirm required fields exist
- confirm numeric values are valid
- reject malformed or incomplete rows
- normalize the dataset shape for downstream analysis

### Summary Metrics

The product must compute at least:

- total readings
- average voltage
- average current
- peak temperature
- minimum voltage
- maximum voltage

### Threshold Alerts

The product must check for:

- over-temperature conditions
- under-voltage conditions
- over-current conditions

Each alert should include:

- type
- timestamp
- value
- severity
- human-readable explanation

### Moving Average Smoothing

The product should compute rolling averages for:

- voltage
- current
- temperature

This is intended to reduce noise and improve readability of trends and anomaly inspection.

### Abnormal Drop Detection

The product must detect sudden voltage drops across nearby readings and flag them as anomalies when the drop exceeds a defined threshold over a short interval.

### Health Classification

The product must assign one overall dataset status:

- Stable
- Warning
- Critical

This classification should be rule-based and depend on the number and severity of alerts and anomalies found in the dataset.

### Results Dashboard

The product must present analysis results in a dashboard that includes:

#### Health Summary
A top-level summary showing:

- overall health classification
- total readings
- alert count
- average voltage
- peak temperature

#### Alerts Panel
A structured list of detected alert events.

#### Charts
Time-series charts for:

- voltage over time
- current over time
- temperature over time

The interface may also display smoothed data and anomaly markers.

### Export

The product should support export of:

- a JSON summary of the analysis
- a CSV containing flagged anomalies

## Constraints

The product must follow these constraints:

- It must be usable through a browser.
- It must not require user accounts, login, or signup.
- It must not permanently store uploaded datasets on the server.
- Analysis should be request-scoped and handled in memory for that request.
- Any persistence should be optional and local to the user’s browser.
- The solution should stay focused on measured battery data analysis, not broader battery platform functionality.

## Non-Goals

CellScope is not intended to:

- simulate battery chemistry or physical battery dynamics
- generate synthetic battery behavior
- support multi-user cloud accounts
- provide real-time IoT streaming in the initial version
- use machine learning for predictions
- act as a full battery management system

## Success Criteria

CellScope is successful if a user can take a battery dataset, submit it through the app, and quickly get a clear answer about the dataset’s condition through metrics, alerts, anomalies, and a simple overall health classification.

More concretely, success means:

- users can input data through CSV upload or manual entry without confusion
- invalid datasets are clearly rejected
- valid datasets produce useful metrics and visible diagnostic output
- unsafe or suspicious readings are flagged clearly
- the dashboard makes trends and issues easier to understand than raw rows alone
- the app remains simple, focused, and publicly usable without account friction

## Acceptance Criteria

A version of CellScope is acceptable when all of the following are true:

1. A user can upload a CSV with `timestamp`, `voltage`, `current`, and `temperature`.
2. A user can manually enter, edit, add, and delete battery reading rows in the UI.
3. The system validates required fields and rejects malformed or incomplete input.
4. The system computes summary metrics including total readings, average voltage, average current, peak temperature, minimum voltage, and maximum voltage.
5. The system detects threshold-based issues for over-temperature, under-voltage, and over-current conditions.
6. The system detects abnormal voltage drops over short intervals.
7. The system assigns an overall health classification of Stable, Warning, or Critical.
8. The system presents results in a dashboard with a health summary, alerts list, and time-series charts.
9. The system can export a JSON summary and a CSV of flagged anomalies.
10. The product does not require accounts.
11. The server does not permanently store uploaded datasets.
12. Any persistence, if present, is local to the browser rather than server-side.

## Product Summary

In one sentence:

**CellScope is a web-based battery diagnostics tool that transforms measured battery readings into alerts, trends, anomalies, and a clear overall health assessment.**