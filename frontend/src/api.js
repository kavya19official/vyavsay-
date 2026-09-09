/* ---------------------------------------------------------------------- */
/*  API CLIENT — talks to the Express backend in /backend                  */
/*  In dev, Vite proxies /api/* to http://localhost:4000 (see vite.config).*/
/* ---------------------------------------------------------------------- */

async function request(path, options) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body
  }
  if (!res.ok) {
    const message = (body && body.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const api = {
  getChallenges: () => request("/challenges"),
  getChallenge: (id) => request(`/challenges/${id}`),
  getStartups: () => request("/startups"),
  getDiscovery: (challengeId) => request(`/challenges/${challengeId}/discovery`),
  getApplications: (challengeId) => request(`/challenges/${challengeId}/applications`),
  applyToChallenge: (challengeId, startupId) =>
    request(`/challenges/${challengeId}/applications`, {
      method: "POST",
      body: JSON.stringify({ startupId }),
    }),
  getRubric: (challengeId) => request(`/challenges/${challengeId}/rubric`),
  getEvaluations: (challengeId) => request(`/challenges/${challengeId}/evaluations`),
  submitEvaluation: (challengeId, { startupId, evaluatorName, scores }) =>
    request(`/challenges/${challengeId}/evaluations`, {
      method: "POST",
      body: JSON.stringify({ startupId, evaluatorName, scores }),
    }),
};
