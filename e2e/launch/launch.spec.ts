import { expect, test, type Request } from '@playwright/test';
import { COURSE_ID, heading, keepLocal, playModule00 } from '../course/play.ts';

// The course launched as SparkLMS launches it (D18, D19, D23): a launch query string whose
// record store Playwright stands in for, so nothing reaches a server. Every request the course
// makes to it is recorded and checked against the launch: the 1.0.2 version header, the
// Authorization value verbatim, the actor verbatim, the registration, the launch activity_id
// as the course and course.yaml's id as the parent, and the State writes with the progress.

// An invented learner and record store in SparkLMS's shape.
const ACTOR = { objectType: 'Agent', name: 'A Learner', account: { homePage: 'https://lms.example.com', name: 'learner-1' } };
const REGISTRATION = '7d1f2c3a-1b2c-4d5e-8f90-123456789abc';
const AUTH = `tincan e2e-token ${REGISTRATION}`;
const LAUNCH_ACTIVITY_ID = 'http://evolve/abc';

interface Recorded {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body: unknown;
}

interface Statement {
  actor: unknown;
  verb: { id: string };
  object: { id: string };
  context?: { registration?: string; contextActivities?: Record<string, { id: string }[]> };
}

const VERB = 'http://adlnet.gov/expapi/verbs/';

test('a launch sends every statement and State write to the record store with the launch values', async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const origin = new URL(baseURL!).origin;
  const endpoint = `${origin}/lrs/`;
  const external = await keepLocal(page, origin);

  // The record store: statements and State writes answered and recorded; no State to read.
  const requests: Recorded[] = [];
  await page.route(`${endpoint}**`, async (route) => {
    const request: Request = route.request();
    const url = new URL(request.url());
    const body = request.postData();
    requests.push({ method: request.method(), url, headers: await request.allHeaders(), body: body === null ? null : JSON.parse(body) });
    const state = url.pathname.endsWith('/activities/state');
    if (state && request.method() === 'GET') return route.fulfill({ status: 404, body: '' });
    if (state) return route.fulfill({ status: 204 });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['ok']) });
  });

  const search = new URLSearchParams({
    endpoint,
    auth: AUTH,
    actor: JSON.stringify(ACTOR),
    registration: REGISTRATION,
    activity_id: LAUNCH_ACTIVITY_ID,
  });
  await page.clock.install();
  await page.goto(`/?${search}`);
  await expect(page.getByText('Your role: learning designer')).toBeVisible();
  // No preview with a launch: no badge, no drawer.
  await expect(page.getByText('PREVIEW', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Statements/ })).toHaveCount(0);

  await page.getByRole('link', { name: 'Take the job' }).click();
  await expect(heading(page)).toHaveText('Agents are better at reviewing than building.');
  await playModule00(page);
  await expect(page.getByRole('banner')).toContainText('1 of 8 done');

  const isStatements = (r: Recorded) => r.url.pathname.endsWith('/statements');
  const isStateWrite = (r: Recorded) => r.url.pathname.endsWith('/activities/state') && r.method !== 'GET';
  const statements = () => requests.filter(isStatements).flatMap((r) => (Array.isArray(r.body) ? r.body : [r.body]) as Statement[]);
  const lastState = () => requests.filter(isStateWrite).at(-1)?.body as { modules?: Record<string, { completed?: boolean }> } | undefined;

  // The queue sends one request at a time: wait for the last statement and the last State write.
  const sent = [
    `${VERB}initialized ${LAUNCH_ACTIVITY_ID}`,
    ...Array.from({ length: 5 }, () => `${VERB}interacted ${COURSE_ID}modules/00/interactions/what-went-wrong`),
    `${VERB}completed ${COURSE_ID}fridge/one-shot`,
    `${VERB}answered ${COURSE_ID}modules/00/checks/1`,
    `${VERB}answered ${COURSE_ID}modules/00/checks/1`,
    `${VERB}answered ${COURSE_ID}modules/00/checks/2`,
    `${VERB}completed ${COURSE_ID}modules/00`,
  ];
  await expect.poll(() => statements().map((s) => `${s.verb.id} ${s.object.id}`)).toEqual(sent);
  await expect.poll(() => lastState()?.modules?.['00']?.completed).toBe(true);

  // Every request: the version header and the Authorization value, as the launch gave it.
  for (const request of requests) {
    expect(request.headers['x-experience-api-version'], `${request.method} ${request.url}`).toBe('1.0.2');
    expect(request.headers.authorization, `${request.method} ${request.url}`).toBe(AUTH);
  }

  // Every statement: the actor verbatim and the registration; the course by the launch's id,
  // everything in it with course.yaml's id as parent and the launch's as grouping.
  for (const statement of statements()) {
    expect(statement.actor).toEqual(ACTOR);
    expect(statement.context?.registration).toBe(REGISTRATION);
    if (statement.verb.id === `${VERB}initialized`) {
      expect(statement.object.id).toBe(LAUNCH_ACTIVITY_ID);
      expect(statement.context?.contextActivities).toEqual({ grouping: [{ objectType: 'Activity', id: COURSE_ID }] });
    } else {
      expect(statement.object.id.startsWith(COURSE_ID), statement.object.id).toBe(true);
      expect(statement.context?.contextActivities).toEqual({
        parent: [{ objectType: 'Activity', id: COURSE_ID }],
        grouping: [{ objectType: 'Activity', id: LAUNCH_ACTIVITY_ID }],
      });
    }
  }

  // State: read once under the launch, then written under it with the progress document.
  const stateRequests = requests.filter((r) => r.url.pathname.endsWith('/activities/state'));
  expect(stateRequests[0].method).toBe('GET');
  expect(requests.filter(isStateWrite).length).toBeGreaterThan(0);
  for (const { url } of stateRequests) {
    expect(url.searchParams.get('activityId')).toBe(LAUNCH_ACTIVITY_ID);
    expect(JSON.parse(url.searchParams.get('agent') ?? 'null')).toEqual(ACTOR);
    expect(url.searchParams.get('registration')).toBe(REGISTRATION);
    expect(url.searchParams.get('stateId')).toBe('progress');
  }
  expect(lastState()).toEqual({
    version: 1,
    modules: {
      '00': {
        reached: 7,
        completed: true,
        answers: {
          'what-went-wrong': { answer: { picked: [0, 1, 2, 3, 4] } },
          'one-shot': expect.objectContaining({ score: { raw: 50, max: 1400 } }),
          'check-1': { answer: { picked: [1] }, score: { raw: 1, max: 1 }, right: true },
          'check-2': { answer: { picked: [1] }, score: { raw: 1, max: 1 }, right: true },
        },
      },
    },
  });

  expect(external).toEqual([]);
});
