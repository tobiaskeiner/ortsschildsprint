import Dropzone from "react-dropzone";
import useFileParse from "../hooks/useParseFile";
import { FormattedMessage } from "react-intl";

const ChangeFile: React.FC = () => {
  const { parseFile } = useFileParse();

  return (
    <div className="flex flex-col gap-4 rounded-[1.75rem] bg-surface-container-lowest p-5 shadow-lg sm:p-6 md:p-8">
      <Dropzone
        maxFiles={1}
        accept={{ "application/xml": [".gpx", ".tcx", ".fit"] }}
        onDrop={(acceptedFiles) =>
          void parseFile({
            file: acceptedFiles[0],
          })
        }
      >
        {({ getRootProps, getInputProps }) => (
          <section>
            <div {...getRootProps({ className: "cursor-pointer rounded-2xl" })}>
              <input {...getInputProps()} />

              <span className="font-headline font-bold text-on-surface tracking-tight uppercase">
                <FormattedMessage id="changeFile.title" />
              </span>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                <FormattedMessage id="changeFile.description" />
              </p>
              <button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-low px-4 py-3 text-sm font-bold uppercase tracking-widest text-on-surface transition-colors hover:cursor-pointer hover:bg-surface-container"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">
                  upload_file
                </span>
                <FormattedMessage id="changeFile.button" />
              </button>
            </div>
          </section>
        )}
      </Dropzone>
    </div>
  );
};

export default ChangeFile;
