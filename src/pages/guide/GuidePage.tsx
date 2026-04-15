import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useTranslation from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/translations";

interface Section {
  titleKey: TranslationKey;
  contentKey?: TranslationKey;
  steps?: { labelKey: TranslationKey; textKey: TranslationKey }[];
  featureKeys?: TranslationKey[];
  table?: { headers: [TranslationKey, TranslationKey]; rows: [string, TranslationKey][] };
}

const sections: Section[] = [
  {
    titleKey: "guide.s1.title",
    contentKey: "guide.s1.content",
  },
  {
    titleKey: "guide.s2.title",
    steps: [
      { labelKey: "guide.s2.step1.label", textKey: "guide.s2.step1.text" },
      { labelKey: "guide.s2.step2.label", textKey: "guide.s2.step2.text" },
      { labelKey: "guide.s2.step3.label", textKey: "guide.s2.step3.text" },
      { labelKey: "guide.s2.step4.label", textKey: "guide.s2.step4.text" },
    ],
  },
  {
    titleKey: "guide.s3.title",
    contentKey: "guide.s3.content",
    featureKeys: ["guide.s3.f1", "guide.s3.f2", "guide.s3.f3", "guide.s3.f4"],
  },
  {
    titleKey: "guide.s4.title",
    contentKey: "guide.s4.content",
    featureKeys: [
      "guide.s4.f1", "guide.s4.f2", "guide.s4.f3",
      "guide.s4.f4", "guide.s4.f5", "guide.s4.f6",
    ],
  },
  {
    titleKey: "guide.s5.title",
    contentKey: "guide.s5.content",
    featureKeys: [
      "guide.s5.f1", "guide.s5.f2", "guide.s5.f3",
      "guide.s5.f4", "guide.s5.f5", "guide.s5.f6",
    ],
  },
  {
    titleKey: "guide.s6.title",
    contentKey: "guide.s6.content",
    table: {
      headers: ["guide.s6.th1", "guide.s6.th2"],
      rows: [
        ["0", "guide.s6.r1"],
        ["1", "guide.s6.r2"],
        ["2", "guide.s6.r3"],
        ["3", "guide.s6.r4"],
        ["4", "guide.s6.r5"],
        ["5+", "guide.s6.r6"],
      ],
    },
  },
  {
    titleKey: "guide.s7.title",
    contentKey: "guide.s7.content",
  },
];

export default function GuidePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("guide.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("guide.description")}
        </p>
      </div>

      {sections.map((section) => (
        <Card key={section.titleKey} className="gap-2 py-4">
          <CardHeader>
            <CardTitle className="text-lg">{t(section.titleKey)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.contentKey && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(section.contentKey)}
              </p>
            )}

            {section.steps && (
              <ol className="space-y-3">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{t(step.labelKey)}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(step.textKey)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {section.featureKeys && (
              <ul className="space-y-1.5">
                {section.featureKeys.map((fk, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="text-muted-foreground/50 shrink-0">
                      &bull;
                    </span>
                    {t(fk)}
                  </li>
                ))}
              </ul>
            )}

            {section.table && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      {section.table.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">
                          {t(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, ri) => (
                      <tr key={ri} className="border-t">
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {row[0]}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {t(row[1])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
