import React from "react";
import Section from "../components/Section";
export default function Terms(){
  return (
    <Section title="Kullanım Şartları" subtitle="Kısa, okunur, bölümlü metin.">
      <div style={{ lineHeight:1.75, color:"rgba(230,237,247,.88)" }}>
        <p><b>1) Amaç</b><br/>GaiaTrace; karbon farkındalığı, sürdürülebilir alışkanlıklar ve güvenli topluluk etkileşimi için tasarlanmıştır.</p>
        <p><b>2) İçerik Kuralları</b><br/>Nefret söylemi, taciz, şiddet, yasa dışı içerik, kişisel veri paylaşımı, telif ihlali yasaktır. İhlaller kaldırılır.</p>
        <p><b>3) Topluluk</b><br/>GaiaChat paylaşımları moderasyona tabidir. Gerekirse hesap kısıtlanabilir.</p>
        <p><b>4) Karbon Hesapları</b><br/>Hesaplar bilgilendirme amaçlıdır. Katsayılar kaynaklara göre değişebilir; zamanla güncellenebilir.</p>
        <p><b>5) Gizlilik</b><br/>Minimum veri saklanır. Profil gizlilik ayarıyla görünürlüğünü yönetebilirsin.</p>
        <p><b>6) Değişiklik</b><br/>Şartlar güncellenebilir. Kullanıma devam etmek kabul anlamına gelir.</p>
        <div className="badge">Bu taslak metin; ileride hukukî metne dönüştürülebilir.</div>
      </div>
    </Section>
  );
}
