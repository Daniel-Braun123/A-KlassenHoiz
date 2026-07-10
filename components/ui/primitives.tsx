import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  headingId?: string;
};

export function PageHeader({ eyebrow, title, description, actions, headingId }: PageHeaderProps) {
  return (
    <header className="page-header home-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 id={headingId}>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ icon, title, children, actions, compact = false }: EmptyStateProps) {
  return (
    <section className={["empty-state", compact ? "compact-empty" : ""].filter(Boolean).join(" ")}>
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <h2>{title}</h2>
      <div className="empty-state-copy">{children}</div>
      {actions ? <div className="empty-state-actions">{actions}</div> : null}
    </section>
  );
}

type FeedbackProps = {
  kind?: "info" | "success" | "error";
  children: ReactNode;
};

export function Feedback({ kind = "info", children }: FeedbackProps) {
  return (
    <p className={`feedback is-${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}
