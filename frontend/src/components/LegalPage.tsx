import { FormattedMessage } from "react-intl";

const LegalPage: React.FC = () => {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
      <div className="rounded-[2rem] border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-sm sm:p-8 md:p-10">
        <h1 className="text-3xl font-headline font-black tracking-tight text-on-surface sm:text-4xl mb-2">
          <FormattedMessage id="legalnotice.title" />
        </h1>
        <h2 className="font-headline text-2xl text-on-surface font-black">
          <FormattedMessage id="legalnotice.name" />
        </h2>
        <p className="font-body">
          Tobias Keiner
          <br />
          Helmholtzstraße 2<br />
          01069 Dresden
        </p>
        <h2 className="font-headline text-2xl text-on-surface font-black">
          <FormattedMessage id="legalnotice.contact" />
        </h2>
        <p>E-Mail: mail@ortsschildsprint.com</p>
      </div>
    </section>
  );
};

export default LegalPage;
