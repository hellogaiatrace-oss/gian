import React, { useMemo, useState } from "react";
import Section from "../components/Section";
import { useI18n } from "../i18n/useI18n";

const SUPPORT_EMAIL = "support@gaiatrace.app";

export default function Support(){
  const { t } = useI18n();
  const [q, setQ] = useState("");

  const faqs = useMemo(()=>[
    { k:"what_is", q: t("faq_what_is_q"), a: t("faq_what_is_a") },
    { k:"how_carbon", q: t("faq_how_carbon_q"), a: t("faq_how_carbon_a") },
    { k:"privacy", q: t("faq_privacy_q"), a: t("faq_privacy_a") },
    { k:"copyright", q: t("faq_copyright_q"), a: t("faq_copyright_a") },
    { k:"report", q: t("faq_report_q"), a: t("faq_report_a") },
    { k:"delete", q: t("faq_delete_q"), a: t("faq_delete_a") },
  ], [t]);

  const filtered = useMemo(()=>{
    const s = (q||"").trim().toLowerCase();
    if(!s) return faqs;
    return faqs.filter(x => (x.q||"").toLowerCase().includes(s) || (x.a||"").toLowerCase().includes(s));
  }, [faqs, q]);

  return (
    <Section title={t("support")} subtitle={t("support_subtitle")}>
      <div className="card" style={{ padding: 12 }}>
        <div className="row" style={{ gap: 10, alignItems:"center" }}>
          <input
            className="input"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder={t("support_search_placeholder")}
            style={{ flex: 1 }}
          />
          <span className="pill">{filtered.length}</span>
        </div>
        <div style={{ height: 12 }} />
        {filtered.length === 0 ? (
          <div className="muted">{t("support_no_results")}</div>
        ) : (
          <div style={{ display:"grid", gap: 10 }}>
            {filtered.map(item => (
              <details key={item.k} className="card" style={{ padding: 12, background:"rgba(255,255,255,.06)" }}>
                <summary style={{ cursor:"pointer", fontWeight: 700 }}>{item.q}</summary>
                <div style={{ height: 8 }} />
                <div className="muted" style={{ lineHeight: 1.55 }}>{item.a}</div>
              </details>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 14 }} />

      <div className="card" style={{ padding: 12 }}>
        <h3 style={{ margin: 0 }}>{t("support_contact_title")}</h3>
        <div style={{ height: 6 }} />
        <div className="muted" style={{ lineHeight: 1.55 }}>
          {t("support_contact_body")}{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color:"rgba(56,189,248,.95)" }}>{SUPPORT_EMAIL}</a>
        </div>
        <div style={{ height: 10 }} />
        <div className="muted" style={{ fontSize: 12 }}>
          {t("support_contact_note")}
        </div>
      </div>
    </Section>
  );
}
