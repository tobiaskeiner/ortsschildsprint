import { bindings } from "./config";

/**
 * Cloudflare Workers count every outgoing fetch call of one invocation against
 * a shared subrequest limit — 50 per invocation on the free plan, 1,000 on the
 * paid plan. Every Strava and Supabase request this Worker makes is such a
 * fetch, and a request that exceeds the limit fails, so scheduled Strava
 * batches must plan to finish inside their invocation's budget.
 */
export const SUBREQUEST_LIMIT_PER_INVOCATION = 50;

/**
 * Estimates of a batch's cost are approximations, never exact counts, so the
 * last few subrequests of an invocation are never planned into; they absorb
 * small estimation misses instead of killing a ride mid-processing.
 */
const SUBREQUEST_ESTIMATE_MARGIN = 4;

/**
 * The maximum number of budgeted subrequests one invocation may plan for.
 */
export const usableSubrequestsPerInvocation = () =>
  SUBREQUEST_LIMIT_PER_INVOCATION - SUBREQUEST_ESTIMATE_MARGIN;

let subrequestsUsed = 0;

/**
 * A fetch wrapper that counts the subrequests this isolate spends on external
 * services. It covers every Strava and Supabase call, including requests
 * supabase-js issues internally. Planned work compares its estimated cost
 * against this count before it starts, so a batch can stop cleanly with the
 * cursor advanced past every fully processed ride instead of being cut off by
 * the platform mid-request.
 */
export const countedFetch = (async (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (
    url.startsWith("https://www.strava.com/") ||
    url.startsWith(bindings.SUPABASE_URL)
  ) {
    subrequestsUsed += 1;
  }
  return fetch(input, init);
}) as typeof fetch;

/**
 * Thrown mid-ride when planning discovers the invocation cannot pay for the
 * remaining requests. Callers treat it as a clean stop: work committed so
 * far stays, the current ride is retried by the next schedule.
 */
export class SubrequestBudgetExhaustedError extends Error {
  constructor() {
    super("The invocation's subrequest budget is exhausted");
  }
}

export interface SubrequestBudget {
  /** Reports whether the estimated cost still fits the invocation's budget. */
  canSpend: (estimatedCount: number) => boolean;
}

/**
 * Bounds the planned work of one invocation by the isolate's subrequest
 * counter. The counter is deliberately never reset: a concurrent invocation
 * in the same isolate (a user-triggered import, an overlapping schedule)
 * only inflates another budget's usage estimate, which is the safe
 * direction — it stops new work early instead of overrun.
 */
export const startSubrequestBudget = (
  limit: number = usableSubrequestsPerInvocation(),
): SubrequestBudget => {
  const invocationStart = subrequestsUsed;
  return {
    canSpend: (estimatedCount) =>
      subrequestsUsed - invocationStart + estimatedCount <= limit,
  };
};
