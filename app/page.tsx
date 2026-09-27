import { NewSessionForm } from "@/components/NewSessionForm";
import { SettingsButton } from "@/components/SettingsButton";
import { I18nProvider } from "@/components/I18nProvider";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getPendingMachine } from "@/lib/data/compare";

export default async function HomePage() {
  const lang = await getLang();
  // Not awaited: the form renders immediately and the machine figure streams
  // in when Neon answers. A failed query just hides the hint.
  const machinePending = getPendingMachine().catch(() => null);

  return (
    <I18nProvider lang={lang}>
      <div className="flex flex-1 flex-col bg-background">
        <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6">
          <div className="mb-4 flex items-center justify-between px-1">
            <h1 className="text-xl font-bold text-brand-navy">
              {t(lang, "newSession")}
            </h1>
            <SettingsButton />
          </div>
          <NewSessionForm machinePending={machinePending} />
        </main>
      </div>
    </I18nProvider>
  );
}
