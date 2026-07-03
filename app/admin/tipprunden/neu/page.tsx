import { TipprundeCreateForm } from "@/components/admin/tipprunde-create-form";

export default function NeueTipprundePage() {
  return (
    <main>
      <section className="admin-panel" aria-labelledby="create-tipprunde-heading">
        <p className="eyebrow">Neue Tipprunde</p>
        <h1 id="create-tipprunde-heading">Tipprunde erstellen</h1>
        <TipprundeCreateForm />
      </section>
    </main>
  );
}
