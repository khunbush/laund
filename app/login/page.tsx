import { PasscodeForm } from "@/components/PasscodeForm";
import { I18nProvider } from "@/components/I18nProvider";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

export default async function LoginPage() {
  const lang = await getLang();
  return (
    <I18nProvider lang={lang}>
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-3xl bg-brand-surface p-8 shadow-xl shadow-black/5">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-orange text-2xl font-bold text-white">
            ฿
          </div>
          <h1 className="font-serif text-3xl font-normal text-brand-navy">Laund</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {t(lang, "enterPasscode")}
          </p>
        </div>
        <PasscodeForm />
      </div>
    </main>
    </I18nProvider>
  );
}
