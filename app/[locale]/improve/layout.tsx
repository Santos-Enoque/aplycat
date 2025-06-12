import { Suspense } from "react";
import { useTranslations } from "next-intl";

function LoadingFallback() {
  const t = useTranslations("improve");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h3 className="text-xl font-semibold mb-2">{t("loading.title")}</h3>
      </div>
    </div>
  );
}

export default function ImproveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}
