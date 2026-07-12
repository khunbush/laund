import { notFound } from "next/navigation";
import { getSessionById } from "@/lib/data/sessions";
import { EditSessionForm } from "@/components/EditSessionForm";
import { DeleteSessionButton } from "@/components/DeleteSessionButton";
import { PaidToggle } from "@/components/PaidToggle";
import type { DenomCounts } from "@/lib/denominations";
import { I18nProvider } from "@/components/I18nProvider";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const lang = await getLang();
  const { id } = await params;
  const session = await getSessionById(id);

  if (!session) {
    notFound();
  }

  const initialCounts: DenomCounts = {
    note1000: session.note1000,
    note500: session.note500,
    note100: session.note100,
    note50: session.note50,
    note20: session.note20,
    coin10: session.coin10,
    coin5: session.coin5,
    coin2: session.coin2,
    coin1: session.coin1,
  };

  return (
    <I18nProvider lang={lang}>
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6">
        <div className="mb-4 flex items-center justify-between gap-2 px-1">
          <h1 className="text-xl font-bold text-brand-navy">{t(lang, "editSession")}</h1>
          <div className="flex items-center gap-2">
            <PaidToggle sessionId={session.id} paid={session.paid} />
            <DeleteSessionButton sessionId={session.id} redirectTo="/sessions" />
          </div>
        </div>
        <EditSessionForm
          sessionId={session.id}
          initialDate={session.date.toISOString().slice(0, 10)}
          initialCounts={initialCounts}
          initialKind={session.kind}
          initialNote={session.note ?? ""}
          originalTotal={session.totalBaht}
        />
      </main>
    </div>
    </I18nProvider>
  );
}
