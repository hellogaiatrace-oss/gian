import React from "react";
import Section from "../components/Section";
import { useI18n } from "../i18n/useI18n";

export default function Settings(){
  const { lang, updateLanguage } = useI18n();
  return (
    <Section title="Ayarlar" subtitle="Dil seçimi burada değişir.">
      <div className="row" style={{ flexWrap:"wrap" }}>
        <span className="badge">Dil</span>
        <select className="input" style={{ maxWidth: 220 }} value={lang || "tr"} onChange={e=>updateLanguage(e.target.value)}>
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </div>
      <div style={{ height: 10 }} />
      <small className="muted">İlk açılışta dil sorulur, sonra buradan değiştirebilirsin.</small>
    </Section>
  );
}
