import React from "react";
import Section from "../components/Section";
import Toast from "../components/Toast";
import { listTales } from "../services/data";

export default function Tales(){
  const [toast, setToast] = React.useState({ message:"", type:"info" });
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [openId, setOpenId] = React.useState(null);

  async function refresh(){
    setLoading(true);
    try{
      const d = await listTales();
      setItems(d);
    }catch(e){ setToast({ message:e?.message||"Hata", type:"error" }); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ refresh(); }, []);

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message:"", type:"info" })} />
      <Section
        title="Masallar"
        subtitle="Çocukları doğayı sevmeye teşvik eden, GaiaTrace'i anlatan masallar."
        right={<button className="btn" onClick={refresh}>Yenile</button>}
      >
        {loading ? <small className="muted">Yükleniyor...</small> : (
          <div style={{ display:"grid", gap: 12 }}>
            {items.map(t => (
              <div key={t.id} className="card" style={{ padding: 12, background:"rgba(255,255,255,.05)" }}>
                <div className="row" style={{ justifyContent:"space-between" }}>
                  <div style={{ fontWeight:900 }}>{t.title}</div>
                  <span className="badge">{t.age || "6+"}</span>
                </div>
                <small className="muted">{(t.tags || []).slice(0,3).join(" • ")}</small>
                <div style={{ height: 10 }} />
                <button className="btn btnPrimary" onClick={()=>setOpenId(openId===t.id ? null : t.id)}>
                  {openId===t.id ? "Kapat" : "Oku"}
                </button>
                {openId===t.id && (
                  <div style={{ marginTop: 12, lineHeight:1.8, whiteSpace:"pre-wrap", color:"rgba(230,237,247,.9)" }}>
                    {t.body}
                  </div>
                )}
              </div>
            ))}
            {items.length===0 && <small className="muted">Henüz masal yok. Admin panelden eklenir.</small>}
          </div>
        )}
      </Section>
    </div>
  );
}
