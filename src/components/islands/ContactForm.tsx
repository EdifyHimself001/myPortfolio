import { useState } from "react";
import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

type Status = "idle" | "sending" | "success" | "error";

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (values.name.trim().length < 2)
    errors.name = "Please enter your name (at least 2 characters).";
  if (!EMAIL_RE.test(values.email.trim()))
    errors.email = "Please enter a valid email address.";
  if (values.subject.trim().length < 3)
    errors.subject = "Please add a short subject.";
  if (values.message.trim().length < 20)
    errors.message = "Your message is a little short — at least 20 characters.";
  return errors;
}

const inputClass =
  "w-full rounded-sm border bg-white/[0.04] px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-accent focus:outline-none";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [values, setValues] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    company: "",
  });

  function update(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (values.company !== "") {
      setStatus("success");
      return;
    }

    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setStatus("sending");
    setServerError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (response.ok && data.ok) {
        setStatus("success");
        window.va?.("event", { name: "contact_submit" });
        return;
      }

      if (response.status === 503) {
        setServerError(
          "The contact form isn't configured yet on this deployment. Please email me directly instead."
        );
      } else if (response.status === 404) {
        setServerError(
          "This site is running in static mode without a form backend. Please email me directly instead."
        );
      } else if (response.status === 429) {
        setServerError("Too many messages sent recently. Please try again later.");
      } else {
        setServerError(
          data.error ?? "Something went wrong while sending your message."
        );
      }
      setStatus("error");
    } catch {
      setServerError("Network error — please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="border border-line bg-panel p-8 text-center sm:p-12"
      >
        <CheckCircle2 size={40} className="mx-auto text-accent" aria-hidden="true" />
        <h2 className="mt-6 text-xl font-bold text-white">Message sent</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
          Thanks for reaching out — I'll get back to you as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => {
            setValues({ name: "", email: "", subject: "", message: "", company: "" });
            setStatus("idle");
          }}
          className="btn btn-outline mt-8"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={(e) => update("company", e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mb-1.5 block text-sm font-medium text-neutral-200">
            Name <span className="text-accent">*</span>
          </label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            onBlur={() =>
              setErrors((prev) => ({
                ...prev,
                name: validate({ ...values }).name,
              }))
            }
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cf-name-error" : undefined}
            placeholder="Your full name"
            className={inputClass}
          />
          {errors.name && (
            <p id="cf-name-error" role="alert" className="mt-1.5 text-xs text-red-400">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cf-email" className="mb-1.5 block text-sm font-medium text-neutral-200">
            Email <span className="text-accent">*</span>
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            onBlur={() =>
              setErrors((prev) => ({
                ...prev,
                email: validate({ ...values }).email,
              }))
            }
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "cf-email-error" : undefined}
            placeholder="you@example.com"
            className={inputClass}
          />
          {errors.email && (
            <p id="cf-email-error" role="alert" className="mt-1.5 text-xs text-red-400">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="cf-subject" className="mb-1.5 block text-sm font-medium text-neutral-200">
          Subject <span className="text-accent">*</span>
        </label>
        <input
          id="cf-subject"
          name="subject"
          type="text"
          required
          value={values.subject}
          onChange={(e) => update("subject", e.target.value)}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "cf-subject-error" : undefined}
          placeholder="What is this about?"
          className={inputClass}
        />
        {errors.subject && (
          <p id="cf-subject-error" role="alert" className="mt-1.5 text-xs text-red-400">
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-sm font-medium text-neutral-200">
          Message <span className="text-accent">*</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={6}
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "cf-message-error" : undefined}
          placeholder="Tell me about your project, timeline and budget…"
          className={`${inputClass} resize-y`}
        />
        {errors.message && (
          <p id="cf-message-error" role="alert" className="mt-1.5 text-xs text-red-400">
            {errors.message}
          </p>
        )}
      </div>

      {status === "error" && serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-sm border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{serverError}</p>
        </div>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
        {status === "sending" ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            <Send size={15} aria-hidden="true" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}