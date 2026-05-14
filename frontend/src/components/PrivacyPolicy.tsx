import type { ReactNode } from "react";
import { Fragment } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  privacyPolicySections as dePrivacyPolicySections,
  privacyPolicyUpdatedAt as dePrivacyPolicyUpdatedAt,
} from "../content/privacyPolicy.de";
import {
  privacyPolicySections as enPrivacyPolicySections,
  privacyPolicyUpdatedAt as enPrivacyPolicyUpdatedAt,
} from "../content/privacyPolicy.en";

const linkClassName = "font-medium text-primary underline underline-offset-2";
const inlineTokenPattern =
  /https?:\/\/[^\s]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const trailingPunctuationPattern = /^(https?:\/\/[^\s]+?)([).,;:]*)$/i;

const renderInlineLinks = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const matcher = new RegExp(inlineTokenPattern);
  let cursor = 0;
  let match: RegExpExecArray | null = matcher.exec(text);

  while (match) {
    const token = match[0];
    const matchIndex = match.index;

    if (cursor < matchIndex) {
      const plainText = text.slice(cursor, matchIndex);
      nodes.push(<span key={`text-${cursor}`}>{plainText}</span>);
    }

    if (/^https?:\/\//i.test(token)) {
      const trailingMatch = trailingPunctuationPattern.exec(token);
      const href = trailingMatch?.[1] ?? token;
      const trailing = trailingMatch?.[2] ?? "";

      nodes.push(
        <Fragment key={`link-${matchIndex}`}>
          <a
            className={linkClassName}
            href={href}
            rel="noreferrer"
            target="_blank"
          >
            {href}
          </a>
          {trailing && <span>{trailing}</span>}
        </Fragment>,
      );
    } else {
      nodes.push(
        <a
          key={`mail-${matchIndex}`}
          className={linkClassName}
          href={`mailto:${token}`}
        >
          {token}
        </a>,
      );
    }

    cursor = matchIndex + token.length;
    match = matcher.exec(text);
  }

  if (cursor < text.length) {
    nodes.push(<span key={`text-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return nodes;
};

const PrivacyPolicy: React.FC = () => {
  const intl = useIntl();
  const isGerman = intl.locale === "de";
  const privacyPolicySections = isGerman
    ? dePrivacyPolicySections
    : enPrivacyPolicySections;
  const privacyPolicyUpdatedAt = isGerman
    ? dePrivacyPolicyUpdatedAt
    : enPrivacyPolicyUpdatedAt;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
      <div className="rounded-[2rem] border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-sm sm:p-8 md:p-10">
        <h1 className="mb-2 text-3xl font-headline font-black tracking-tight text-on-surface sm:text-4xl">
          <FormattedMessage id="legal.privacyPolicy.title" />
        </h1>
        <p className="mb-8 text-sm font-medium text-secondary">
          Stand: {privacyPolicyUpdatedAt}
        </p>

        <div className="space-y-8">
          {privacyPolicySections.map((section) => (
            <section key={section.title} className="space-y-4">
              <h2 className="font-headline text-2xl font-black text-on-surface">
                {section.title}
              </h2>

              <div className="space-y-3 text-sm leading-relaxed text-on-surface-variant sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{renderInlineLinks(paragraph)}</p>
                ))}
              </div>

              {section.listItems && (
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-on-surface-variant sm:text-base">
                  {section.listItems.map((item) => (
                    <li key={item}>{renderInlineLinks(item)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
