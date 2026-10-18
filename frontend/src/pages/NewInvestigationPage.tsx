import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { createInvestigation } from '../lib/api';

const initialForm = {
  title: '',
  bug_description: '',
  language: 'Python',
  source_code: '',
  expected_behavior: '',
  actual_behavior: '',
  steps_to_reproduce: '',
  reproduction_input: '',
};

function NewInvestigationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = 'Investigation title is required.';
    if (!form.bug_description.trim()) nextErrors.bug_description = 'Bug description is required.';
    if (!form.source_code.trim()) nextErrors.source_code = 'Source code is required.';
    if (!form.expected_behavior.trim()) nextErrors.expected_behavior = 'Expected behavior is required.';
    if (!form.actual_behavior.trim()) nextErrors.actual_behavior = 'Actual behavior is required.';
    if (!form.steps_to_reproduce.trim()) nextErrors.steps_to_reproduce = 'Steps to reproduce are required.';
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        reproduction_input: form.reproduction_input || null,
      };
      const created = await createInvestigation(payload);
      navigate(`/investigations/${created.id}`);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'Unable to create investigation.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <div className="page-eyebrow">NEW EVIDENCE</div>
          <h1 className="page-title">Create investigation</h1>
          <p className="page-description">Describe the issue and capture enough detail to reproduce it.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="surface-card space-y-6 p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Investigation title" error={errors.title}>
            <input
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </Field>

          <Field label="Programming language" error={errors.language}>
            <select
              value={form.language}
              onChange={(event) => updateField('language', event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
            >
              <option value="Python">Python</option>
            </select>
          </Field>
        </div>

        <Field label="Bug description" error={errors.bug_description}>
          <textarea
            value={form.bug_description}
            onChange={(event) => updateField('bug_description', event.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </Field>

        <Field label="Python source code" error={errors.source_code}>
          <textarea
            value={form.source_code}
            onChange={(event) => updateField('source_code', event.target.value)}
            rows={10}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-500"
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Expected behavior" error={errors.expected_behavior}>
            <textarea
              value={form.expected_behavior}
              onChange={(event) => updateField('expected_behavior', event.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </Field>

          <Field label="Actual behavior" error={errors.actual_behavior}>
            <textarea
              value={form.actual_behavior}
              onChange={(event) => updateField('actual_behavior', event.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </Field>
        </div>

        <Field label="Steps to reproduce" error={errors.steps_to_reproduce}>
          <textarea
            value={form.steps_to_reproduce}
            onChange={(event) => updateField('steps_to_reproduce', event.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </Field>

        <div>
          <Field label="Optional reproduction input">
            <textarea
              value={form.reproduction_input}
              onChange={(event) => updateField('reproduction_input', event.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </Field>
        </div>

        {errors.form ? <div className="error-state" role="alert">{errors.form}</div> : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="button-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {submitting ? 'Saving…' : 'Save investigation'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium text-slate-200">{label}</div>
      {children}
      {error ? <div className="mt-2 text-xs text-red-300">{error}</div> : null}
    </label>
  );
}

export default NewInvestigationPage;
