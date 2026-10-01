import { ASSESSMENT_STEPS } from '../data/assessmentSteps';

export function AssessmentNavigation({ activeStep, onSelect }: { activeStep: number; onSelect: (step: number) => void }) {
  return (
    <nav aria-label="Assessment steps" className="no-print lg:sticky lg:top-6 lg:self-start">
      <label className="mb-5 block lg:hidden">
        <span className="mb-2 block text-sm font-semibold text-cardio-primary">Assessment step</span>
        <select className="w-full rounded-lg border border-cardio-border bg-white p-3 text-cardio-primary" value={activeStep} onChange={event => onSelect(Number(event.target.value))}>
          {ASSESSMENT_STEPS.map((step, index) => <option key={step.title} value={index}>{index + 1}. {step.title}</option>)}
        </select>
      </label>
      <ol className="hidden space-y-2 lg:block">
        {ASSESSMENT_STEPS.map((step, index) => (
          <li key={step.title}>
            <button type="button" onClick={() => onSelect(index)} aria-current={activeStep === index ? 'step' : undefined}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm ${activeStep === index ? 'bg-cardio-primary font-semibold text-white' : 'text-gray-600 hover:bg-white hover:text-cardio-primary'}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${activeStep === index ? 'border-white/40' : 'border-cardio-border bg-white'}`} aria-hidden="true">{index + 1}</span>
              {step.title}
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-5 hidden px-3 text-xs leading-relaxed text-gray-500 lg:block">Move between steps to edit your answers. Entries stay here during this visit; refreshing clears the assessment.</p>
    </nav>
  );
}
