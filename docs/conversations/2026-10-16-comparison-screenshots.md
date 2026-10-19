---
date: 2026-10-16
stage: review
title: Screenshots of both builds, for a side-by-side comparison
participants: [Ross, agent]
source: live, written during the session, as the walk through both builds went on
---

# Screenshots of both builds, for a side-by-side comparison

A conversation, condensed, not verbatim: Ross in his own words, the agent in
its own. Ross wanted the same course run in two builds, every page captured, so
he can compare them.

## Ross: run both and screenshot everything

- I have two local builds of the same course running, one on port 5174 and one on
  port 5173, built with different technologies. I want you to go through both
  completely and take a screenshot of every page, and put the screenshots in the
  root of this project so I can compare them.

## Agent: the two builds

- Port 5173 is the Bricks build: eight modules, about 65 screens, with a Modules
  menu and a statements preview. Port 5174 was a single placeholder page at first,
  so I checked which folder was serving it.
- I planned to capture each screen in turn, with the quiz and drag-and-drop
  screens answered so Next unlocks, and to save the captures in one folder per
  build in the project root.

## Ross: please drive the browser

- Please drive the browser, not just read the code.

## Agent: switched to the browser

- I loaded the browser tools and walked both builds through the page, clicking
  Next and screenshotting each screen. Screens that block Next until a question is
  answered got an answer before the next capture.

## Ross: that was the wrong version, start again

- Sorry, that was my mistake: I was running a different version of the course.
  Both servers are running the full versions now. Could you start again, and clear
  the browser so they start from scratch.

## Agent: restarted clean

- The browser had restarted, and the Bricks build had saved its own progress in
  browser storage, so the earlier run resumed partway through. I removed the earlier
  captures, opened each build in its own fresh browser context, cleared the storage
  that was still there, and walked both again from the first screen.
- Port 5174 now serves the full course from the round-two folder, with hash routes
  for the scenario, the home page and eight modules. I captured every module screen,
  the home page before and after completion, and the statements drawer.
- Both fridge activities were run to completion in each build, and I captured a
  wrong drop and the timed-out state of the Vite fridge as well.
- The screenshots are in comparison-screenshots/, one folder per build, and are not
  committed.
