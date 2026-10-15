// The ADL verbs and activity types the course's statements use (D19), on their own with no
// imports, so the packaging script's tincan.xml names the course with the same type.

/** The ADL verbs the course uses. */
export const VERBS = {
  initialized: { id: 'http://adlnet.gov/expapi/verbs/initialized', display: { 'en-US': 'initialized' } },
  completed: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'en-US': 'completed' } },
  answered: { id: 'http://adlnet.gov/expapi/verbs/answered', display: { 'en-US': 'answered' } },
  interacted: { id: 'http://adlnet.gov/expapi/verbs/interacted', display: { 'en-US': 'interacted' } },
} as const;

/** The ADL activity types of the course's objects. */
export const ACTIVITY_TYPES = {
  course: 'http://adlnet.gov/expapi/activities/course',
  module: 'http://adlnet.gov/expapi/activities/module',
  interaction: 'http://adlnet.gov/expapi/activities/cmi.interaction',
  simulation: 'http://adlnet.gov/expapi/activities/simulation',
} as const;
