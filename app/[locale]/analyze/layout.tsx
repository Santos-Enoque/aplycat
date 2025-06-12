import { Suspense } from "react";
import { useTranslations } from "next-intl";

function AnalyzeLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useTranslations("analyzeLayout");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-semibold mb-2">{t("loading")}</h3>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnalyzeLayoutContent>{children}</AnalyzeLayoutContent>;
}
