import { expect, test, type Request } from '@playwright/test';
import { ACTOR_JSON, LAUNCH_ACTIVITY_ID, REGISTRATION, sparkSearch } from '../../src/xapi/fixtures.ts';
import { COURSE_ID, heading, HOME_HEADING, keepLocal, playModule00 } from '../course/play.ts';

// The course launched as SparkLMS launches it (D18, D19, D23): a launch query string whose
// record store Playwright stands in for, so nothing reaches a server. Every request the course
// makes to it is recorded and checked against the launch: the 1.0.2 version header, the
// Authorization value verbatim, the actor verbatim, the registration, the launch activity_id
// as the course and course.yaml's id as the parent, and the State writes with the progress.

// The xAPI tests' invented learner and launch (src/xapi/fixtures.ts), with a record store of its own.
const ACTOR: unknown = JSON.parse(ACTOR_JSON);
const AUTH = `tincan e2e-token ${REGISTRATION}`;

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
  result?: { success?: boolean; score?: { raw?: number; max?: number } };
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

  // SparkLMS's launch parameters, without its keydown and close messages.
  const search = sparkSearch({ endpoint, auth: AUTH, 'keydown-message': null, 'close-message': null });
  await page.clock.install();
  await page.goto(`/${search}`);
  await expect(page.getByText('Your role: learning designer')).toBeVisible();
  // No preview with a launch: no badge, no drawer.
  await expect(page.getByText('PREVIEW', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Statements/ })).toHaveCount(0);

  await page.getByRole('link', { name: 'Take the job' }).click();
  await expect(heading(page)).toHaveText(HOME_HEADING);
  // The first check answered wrong, then right: both answers go to the record store.
  await playModule00(page, { missFirstCheck: true });
  await expect(page.getByRole('banner')).toContainText('1 of 5 done');

  const isStatements = (r: Recorded) => r.url.pathname.endsWith('/statements');
  const isStateWrite = (r: Recorded) => r.url.pathname.endsWith('/activities/state') && r.method !== 'GET';
  const statements = () => requests.filter(isStatements).flatMap((r) => (Array.isArray(r.body) ? r.body : [r.body]) as Statement[]);
  const lastState = () => requests.filter(isStateWrite).at(-1)?.body as { modules?: Record<string, { completed?: boolean }> } | undefined;

  // The queue sends one request at a time: wait for the last statement and the last State write.
  const sent = [
    `${VERB}initialized ${LAUNCH_ACTIVITY_ID}`,
    ...Array.from({ length: 3 }, () => `${VERB}interacted ${COURSE_ID}modules/00/interactions/what-went-wrong`),
    `${VERB}completed ${COURSE_ID}fridge/one-shot`,
    `${VERB}answered ${COURSE_ID}modules/00/checks/1`,
    `${VERB}answered ${COURSE_ID}modules/00/checks/1`,
    `${VERB}answered ${COURSE_ID}modules/00/checks/2`,
    `${VERB}completed ${COURSE_ID}modules/00`,
  ];
  await expect.poll(() => statements().map((s) => `${s.verb.id} ${s.object.id}`)).toEqual(sent);
  await expect.poll(() => lastState()?.modules?.['00']?.completed).toBe(true);
  // The first check's two answers, wrong then right, each with its own result.
  const firstCheck = statements().filter((s) => s.verb.id === `${VERB}answered` && s.object.id === `${COURSE_ID}modules/00/checks/1`);
  expect(firstCheck.map((s) => s.result)).toEqual([
    expect.objectContaining({ success: false, score: expect.objectContaining({ raw: 0, max: 1 }) }),
    expect.objectContaining({ success: true, score: expect.objectContaining({ raw: 1, max: 1 }) }),
  ]);

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
    version: 2,
    savedAt: expect.any(String),
    modules: {
      '00': {
        reached: 8,
        completed: true,
        answers: {
          'what-went-wrong': { answer: { picked: [0, 1, 2] } },
          'one-shot': expect.objectContaining({ score: { raw: 50, max: 1400 } }),
          // State keeps the latest answer, the right one, not the wrong one before it.
          'check-1': { answer: { picked: [1] }, score: { raw: 1, max: 1 }, right: true },
          'check-2': { answer: { picked: [1] }, score: { raw: 1, max: 1 }, right: true },
        },
      },
    },
  });

  expect(external).toEqual([]);
});

test('a State read that fails holds every State write back until a later read answers', async ({ page, baseURL }) => {
  test.setTimeout(60_000);
  const origin = new URL(baseURL!).origin;
  const endpoint = `${origin}/lrs/`;
  const external = await keepLocal(page, origin);

  // The record store: the first State read fails with a 500, every later one answers 404.
  const requests: Recorded[] = [];
  await page.route(`${endpoint}**`, async (route) => {
    const request: Request = route.request();
    const url = new URL(request.url());
    const body = request.postData();
    requests.push({ method: request.method(), url, headers: await request.allHeaders(), body: body === null ? null : JSON.parse(body) });
    const state = url.pathname.endsWith('/activities/state');
    const reads = requests.filter((r) => r.url.pathname.endsWith('/activities/state') && r.method === 'GET').length;
    if (state && request.method() === 'GET') return route.fulfill(reads === 1 ? { status: 500, body: 'down' } : { status: 404, body: '' });
    if (state) return route.fulfill({ status: 204 });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['ok']) });
  });

  const search = sparkSearch({ endpoint, auth: AUTH, 'keydown-message': null, 'close-message': null });
  await page.clock.install();
  await page.goto(`/${search}`);
  await page.getByRole('link', { name: 'Take the job' }).click();
  await expect(heading(page)).toHaveText(HOME_HEADING);
  await playModule00(page);
  await expect(page.getByRole('banner')).toContainText('1 of 5 done');
  // The read is tried again at most once every 30 s, before a write. Jump the clock past it
  // rather than run through it, so the read's own 4 s wait starts afresh and its answer lands.
  await page.clock.fastForward(30_000);

  const isState = (r: Recorded) => r.url.pathname.endsWith('/activities/state');
  const isStateWrite = (r: Recorded) => isState(r) && r.method !== 'GET';
  const statements = () => requests.filter((r) => r.url.pathname.endsWith('/statements')).flatMap((r) => (Array.isArray(r.body) ? r.body : [r.body]) as Statement[]);
  await expect.poll(() => (requests.filter(isStateWrite).at(-1)?.body as { modules?: Record<string, { completed?: boolean }> } | undefined)?.modules?.['00']?.completed).toBe(true);
  // The module's completed goes out once, when the read answers.
  await expect.poll(() => statements().filter((s) => s.verb.id === `${VERB}completed` && s.object.id === `${COURSE_ID}modules/00`).length).toBe(1);

  // No State write before the read that answered.
  const states = requests.filter(isState).map((r) => r.method);
  expect(states.slice(0, 2)).toEqual(['GET', 'GET']);
  expect(states.slice(2).every((method) => method === 'PUT')).toBe(true);
  for (const request of requests) {
    expect(request.headers['x-experience-api-version'], `${request.method} ${request.url}`).toBe('1.0.2');
    expect(request.headers.authorization, `${request.method} ${request.url}`).toBe(AUTH);
  }
  expect(external).toEqual([]);
});
