import { describe, expect, it } from 'vitest';
import { ACTOR_JSON, REGISTRATION, sparkSearch } from './fixtures.ts';
import { courseActivityId, parseLaunch } from './launch.ts';

describe('parseLaunch', () => {
  it('reads a Spark-shaped launch, keeping auth and the actor exactly as given', () => {
    const search = sparkSearch();
    expect(search).toContain('auth=tincan+t+r');
    const launch = parseLaunch(search);
    expect(launch).toEqual({
      endpoint: 'https://lrs.example.com/xapi/',
      auth: 'tincan t r',
      actor: JSON.parse(ACTOR_JSON),
      registration: REGISTRATION,
      activityId: 'http://evolve/abc',
    });
    expect(JSON.stringify(launch?.actor)).toBe(ACTOR_JSON);
  });

  it('reads auth written with %20 as the LMS writes it', () => {
    const search = sparkSearch().replace('auth=tincan+t+r', 'auth=tincan%20t%20r');
    expect(parseLaunch(search)?.auth).toBe('tincan t r');
  });

  it('keeps a numeric-looking registration a string', () => {
    expect(parseLaunch(sparkSearch({ registration: '12345' }))?.registration).toBe('12345');
  });

  it('leaves out a registration and an activity_id the launch does not give', () => {
    const launch = parseLaunch(sparkSearch({ registration: null, activity_id: '' }));
    expect(launch).not.toBeNull();
    expect(launch && 'registration' in launch).toBe(false);
    expect(launch && 'activityId' in launch).toBe(false);
  });

  it.each([
    ['no query string', ''],
    ['only a registration', '?registration=smoke'],
    ['an endpoint without auth', sparkSearch({ auth: null })],
    ['an endpoint without an actor', sparkSearch({ actor: null })],
    ['an actor that is not JSON', sparkSearch({ actor: '{objectType:Agent' })],
    ['an actor that is a JSON string', sparkSearch({ actor: '"learner"' })],
    ['an actor that is a JSON array', sparkSearch({ actor: '[]' })],
    ['auth and an actor but no endpoint', sparkSearch({ endpoint: null })],
    ['garbage', '?%%%&&=&endpoint'],
  ])('is no launch (preview) with %s', (_, search) => {
    expect(parseLaunch(search)).toBeNull();
  });
});

describe('courseActivityId', () => {
  const course = { id: 'https://rosslote.github.io/agent-course/' };

  it("is the launch's activity_id when it has one", () => {
    expect(courseActivityId(course, parseLaunch(sparkSearch()))).toBe('http://evolve/abc');
  });

  it("is course.yaml's id in preview or when the launch has none", () => {
    expect(courseActivityId(course, null)).toBe(course.id);
    expect(courseActivityId(course, parseLaunch(sparkSearch({ activity_id: null })))).toBe(course.id);
  });
});
