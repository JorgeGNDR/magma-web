"use client";

import { type FormEvent, type ReactNode, useRef, useState } from "react";
import styles from "@/app/page.module.css";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm({ children, className, email }: {
  children: ReactNode;
  className: string;
  email: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const pending = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    pending.current = true;
    setStatus("sending");
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== "true")) {
        throw new Error("Submission not accepted");
      }
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      pending.current = false;
    }
  }

  return (
    <form className={className} onSubmit={submit} aria-busy={status === "sending"}>
      {children}
      <div className={styles.contactSubmit}>
        <p role="status" aria-live="polite" aria-atomic="true">
          {status === "sending" ? "Enviando tu proyecto…"
            : status === "success" ? "Mensaje enviado. Te responderemos pronto."
            : status === "error" ? "No hemos podido confirmar el envío. Inténtalo de nuevo o escríbenos por email."
            : "Responderemos lo antes posible."}
        </p>
        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Enviando…" : "Enviar proyecto ↗"}
        </button>
      </div>
      <noscript>Para enviar el formulario, activa JavaScript o escríbenos a <a href={`mailto:${email}`}>{email}</a>.</noscript>
    </form>
  );
}
