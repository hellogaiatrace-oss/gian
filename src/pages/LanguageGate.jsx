import React from "react";
import Section from "../components/Section";
import { useI18n } from "../i18n/useI18n";

export default function LanguageGate(){
  const { chooseLanguage } = useI18n();
  return (
    <div style={{ maxWidth: 520, margin:"0 auto" }}>
      <Section title="Dil seçimi" subtitle="Sadece ilk açılışta sorulur. Sonra Ayarlar'dan değiştirirsin.">
        <div className="grid2">
          <button className="btn btnPrimary" onClick={() => chooseLanguage("tr")}>Türkçe</button>
          <button className="btn btnPrimary" onClick={() => chooseLanguage("en")}>English</button>
        </div>
      </Section>
    </div>
  );
}
