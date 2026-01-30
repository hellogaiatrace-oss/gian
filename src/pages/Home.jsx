import React from "react";
import Section from "../components/Section";
import { useAuth } from "../services/useAuth";
import { ensureDefaultCatalog } from "../services/data";
import { Link } from "react-router-dom";

export default function Home(){
  const { user, profile } = useAuth();

  React.useEffect(() => { ensureDefaultCatalog().catch(()=>{}); }, []);

  return (
    <div className="grid2">
      <Section
        title="GaiaTrace"
        subtitle="Karbon takibi + GaiaCredit + topluluk. Yargılamayan, sakin bir arayüz."
        right={<span className="badge">{user ? (profile?.titleLabel || "Seed") : "guest"}</span>}
      >
        <div style={{ lineHeight:1.6, color:"rgba(230,237,247,.86)" }}>
          <p>
            Burada karbon aktivitelerini <b>katalogdan seçerek</b> eklersin; sistem CO₂ ve GaiaCredit üretir.
            GaiaChat'te paylaşım yapar, Masallar bölümünde çocuklara doğa sevgisini anlatan içerikler okursun.
          </p>
          <div className="row" style={{ flexWrap:"wrap" }}>
            <Link className="btn btnPrimary" to="/carbon" style={{ textDecoration:"none" }}>Karbonu Ekle</Link>
            <Link className="btn" to="/chat" style={{ textDecoration:"none" }}>GaiaChat</Link>
            <Link className="btn" to="/tales" style={{ textDecoration:"none" }}>Masallar</Link>
          </div>
        </div>
      </Section>

      <Section title="GaiaCredit" subtitle="Katkına göre puan + unvan kazanırsın.">
        <div className="card" style={{ padding: 14, background:"rgba(255,255,255,.05)" }}>
          <div className="row" style={{ justifyContent:"space-between" }}>
            <div>
              <div style={{ fontWeight:900, fontSize: 22 }}>{profile?.gaiaCredit ?? 0}</div>
              <small className="muted">toplam kredi</small>
            </div>
            <div style={{ textAlign:"right" }}>
              <div className="badge">{profile?.titleLabel || "Seed"}</div>
              <div style={{ height: 6 }} />
              <small className="muted">{profile?.city || ""} {profile?.country || ""}</small>
            </div>
          </div>
          <hr className="sep" />
          <small className="muted">İpucu: Tasarruf (negatif CO₂) daha çok GaiaCredit getirir.</small>
        </div>
      </Section>
    </div>
  );
}
