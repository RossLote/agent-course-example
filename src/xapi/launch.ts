// The TinCan launch (D18, D23): what the LMS puts in the query string when it opens the
// course. SparkLMS sends endpoint, auth ("tincan <token> <registration>", sent verbatim as the
// Authorization header), actor (an account Agent as JSON, used verbatim), registration and
// activity_id. No launch means preview mode (PLAN.md §6, "Preview mode").
import type { Agent } from '@xapi/xapi';

/** The launch data the course runs on. */
export interface Launch {
  /** The record store's base URL; the statements URL is this plus "statements". */
  endpoint: string;
  /** The Authorization header's value, exactly as the LMS gave it. */
  auth: string;
  /** The learner, exactly as the LMS gave it, parsed from its JSON. */
  actor: Agent;
  /** The registration (a UUID), sent as context.registration on every statement. */
  registration?: string;
  /** The course as the LMS knows it ("http://evolve/<id>"), the object of course-level statements. */
  activityId?: string;
}

/**
 * The launch in a query string, or null when there is none: no endpoint, no auth, or an actor
 * that is missing or is not a JSON object. Parsed here rather than with @xapi/xapi's
 * getTinCanLaunchData, which JSON-parses every value (a numeric registration would become a
 * number) and rewrites the actor's old TinCan array shape: the actor must stay as given.
 */
export function parseLaunch(search: string): Launch | null {
  const params = new URLSearchParams(search);
  const endpoint = params.get('endpoint');
  const auth = params.get('auth');
  const actor = parseActor(params.get('actor'));
  if (!endpoint || !auth || !actor) return null;
  const registration = params.get('registration') || undefined;
  const activityId = params.get('activity_id') || undefined;
  return { endpoint, auth, actor, ...(registration && { registration }), ...(activityId && { activityId }) };
}

function parseActor(json: string | null): Agent | null {
  if (!json) return null;
  try {
    const actor: unknown = JSON.parse(json);
    return isAgent(actor) ? actor : null;
  } catch {
    return null;
  }
}

/** The actor is any JSON object: it is the LMS's to shape, and it is passed on untouched. */
function isAgent(value: unknown): value is Agent {
  return isObject(value);
}

/** A JSON object: not null, not an array. */
export function isObject(value: unknown): value is { [key: string]: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The course's activity id for course-level statements and State: the launch's activity_id
 * when it has one, else course.yaml's id (D23).
 */
export function courseActivityId(course: { id: string }, launch: Launch | null): string {
  return launch?.activityId ?? course.id;
}
