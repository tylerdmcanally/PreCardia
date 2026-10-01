import type { ReactNode } from 'react';

export function AssessmentSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 rounded-lg border border-cardio-border bg-white">
      <h3 className="px-5 py-4 text-lg font-semibold text-cardio-primary sm:px-6">{title}</h3>
      {children}
    </section>
  );
}
