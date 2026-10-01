import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { CURRENT_RELEASE } from '../data/releaseNotes';
import { PERIOPERATIVE_GUIDELINE } from '../logic/precardia/guideline';

const SEEN_VERSION_KEY = 'cardiotools:last-seen-version';

export function ReleaseNotes() {
  const [open, setOpen] = useState(() => {
    try {
      return localStorage.getItem(SEEN_VERSION_KEY) !== CURRENT_RELEASE.version;
    } catch {
      // Storage restrictions must not prevent access to the app.
      return true;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_VERSION_KEY, CURRENT_RELEASE.version);
    } catch {
      // Still dismiss for this visit when browser storage is unavailable.
    }
    setOpen(false);
  };

  return (
    <>
      <footer className="no-print bg-cardio-bg px-4 py-5 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded text-sm font-semibold text-cardio-secondary underline underline-offset-4 hover:text-cardio-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cardio-secondary"
        >
          What’s new · v{CURRENT_RELEASE.version}
        </button>
      </footer>

      <Dialog open={open} onClose={dismiss} className="no-print relative z-50">
        <div className="fixed inset-0 bg-cardio-primary/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-cardio-border px-5 py-5 sm:px-7">
              <div>
                <p className="mb-1 text-sm font-semibold text-cardio-secondary">CardioTools v{CURRENT_RELEASE.version} · {CURRENT_RELEASE.date}</p>
                <DialogTitle className="text-2xl font-bold text-cardio-primary">What’s new</DialogTitle>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close version notes"
                className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-cardio-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cardio-secondary"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-7">
              <h3 className="mb-2 text-lg font-bold text-cardio-primary">{CURRENT_RELEASE.title}</h3>
              <p className="mb-5 text-sm leading-relaxed text-gray-600">{CURRENT_RELEASE.summary}</p>
              <ul className="space-y-4">
                {CURRENT_RELEASE.changes.map(change => (
                  <li key={change.title}>
                    <h4 className="font-semibold text-cardio-primary">{change.title}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{change.description}</p>
                  </li>
                ))}
              </ul>
              <a className="mt-5 inline-block text-sm font-semibold text-cardio-secondary underline underline-offset-4" href={PERIOPERATIVE_GUIDELINE.url} target="_blank" rel="noreferrer">
                Read the 2026 guideline
              </a>
            </div>

            <div className="flex shrink-0 justify-end border-t border-cardio-border px-5 py-4 sm:px-7">
              <button
                type="button"
                data-autofocus
                onClick={dismiss}
                className="rounded-lg bg-cardio-primary px-6 py-2.5 font-semibold text-white hover:bg-cardio-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cardio-secondary"
              >
                Got it
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
