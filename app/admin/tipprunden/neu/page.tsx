import { Plus } from "lucide-react";

import { TipprundeCreateForm } from "@/components/admin/tipprunde-create-form";

export default function NeueTipprundePage() {
  return (
    <main>
      <section className="create-tipprunde-page" aria-labelledby="create-tipprunde-heading">
        <div className="create-tipprunde-card">
          <div className="admin-card-icon">
            <Plus aria-hidden="true" size={22} />
          </div>
          <p className="eyebrow">Neue Tipprunde</p>
          <h1 id="create-tipprunde-heading">Tipprunde erstellen</h1>
          <TipprundeCreateForm />
        </div>
      </section>
    </main>
  );
}
