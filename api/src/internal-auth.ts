import { bindings } from "./config";

export const INTERNAL_API_SECRET_HEADER = "X-Ortsschildsprint-Internal-Secret";

const constantTimeEquals = (first: string, second: string) => {
  let difference = first.length ^ second.length;
  const longestLength = Math.max(first.length, second.length);
  for (let index = 0; index < longestLength; index += 1) {
    difference |=
      (first.charCodeAt(index) || 0) ^ (second.charCodeAt(index) || 0);
  }
  return difference === 0;
};

export const isInternalApplicationRequest = (request: Request) => {
  if (!bindings.INTERNAL_API_SECRET) return false;
  const providedSecret = request.headers.get(INTERNAL_API_SECRET_HEADER);
  return (
    providedSecret !== null &&
    constantTimeEquals(providedSecret, bindings.INTERNAL_API_SECRET)
  );
};
