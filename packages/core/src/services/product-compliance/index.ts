export type RiskCategory = "claims" | "medical" | "supplier" | "brand";
export interface ComplianceRisk {
  category: RiskCategory;
  match: string;
  severity: "high" | "medium";
  reason: string;
  suggestion: string;
  manualConfirmation: boolean;
}
export interface ComplianceReport {
  risks: ComplianceRisk[];
  publishable: boolean;
  advisory: true;
}
export function checkProductCompliance(
  text: string,
  brand?: { name: string; authorized: boolean },
): ComplianceReport {
  const risks: ComplianceRisk[] = [];
  const rules: {
    category: RiskCategory;
    re: RegExp;
    reason: string;
    suggestion: string;
  }[] = [
    {
      category: "claims",
      re: /\b(?:no\.?\s*1|best seller|exclusive|only one|guaranteed|100% safe|unbreakable|indestructible|vet approved)\b/gi,
      reason: "CLAIM_REQUIRES_EVIDENCE",
      suggestion: "Describe a verified feature without rankings or guarantees.",
    },
    {
      category: "medical",
      re: /\b(?:(?:cure|treat|prevent)(?:s|ing)?\s+(?:anxiety|disease)|guaranteed health benefits)\b/gi,
      reason: "UNSUPPORTED_MEDICAL_CLAIM",
      suggestion: "Describe ordinary play or practical use, not treatment.",
    },
    {
      category: "supplier",
      re: /https?:\/\/[^\s]*1688[^\s]*|(?:微信|招商|一件代发|厂家直销)|\b(?:wechat|OEM\/ODM|wholesale price)\b/gi,
      reason: "SUPPLIER_CONTENT_LEAK",
      suggestion: "Keep purchasing and supplier information internal.",
    },
  ];
  for (const rule of rules)
    for (const m of text.matchAll(rule.re)) {
      const prefix = text.slice(Math.max(0, m.index! - 40), m.index);
      const suffix = text.slice(
        m.index! + m[0].length,
        m.index! + m[0].length + 60,
      );
      if (
        /^only one$/i.test(m[0]) &&
        /^\s+(?:replacement\s+)?(?:roll|piece|item|toy)\s+(?:is\s+)?included\b/i.test(
          suffix,
        )
      )
        continue;
      // Negative constraints are not consumer-facing claims.
      if (
        /(?:do not|never|avoid|without|no claims of|not claim)[^.!\n]*$/i.test(
          prefix,
        )
      )
        continue;
      risks.push({
        category: rule.category,
        match: m[0],
        severity: "high",
        reason: rule.reason,
        suggestion: rule.suggestion,
        manualConfirmation: true,
      });
    }
  if (brand?.name && !brand.authorized)
    risks.push({
      category: "brand",
      match: brand.name,
      severity: "medium",
      reason: "BRAND_AUTHORIZATION_UNKNOWN",
      suggestion: "Verify trademark authorization; preserve the real logo.",
      manualConfirmation: true,
    });
  return { risks, publishable: !risks.length, advisory: true };
}
