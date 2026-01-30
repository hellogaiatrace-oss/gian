import React from "react";
import Section from "../components/Section";
import Toast from "../components/Toast";
import { useAuth } from "../services/useAuth";
import { addLog, listMyLogs, searchCatalog } from "../services/data";

function todayStr(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const da = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

export default function Carbon(){
  const { user } = useAuth();
  const [toast, setToast] = React.useState({ message:"", type:"info" });

  const [date, setDate] = React.useState(todayStr());
  const [term, setTerm] = React.useState("");
  const [catalog, setCatalog] = React.useState([]);
  const [activityId, setActivityId] = React.useState("");
  const [qty, setQty] = React.useState(10);
  const [proof, setProof] = React.useState(null);

  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  async function loadCatalog(){
    const items = await searchCatalog(term);
    setCatalog(items);
    if(!activityId && items[0]) setActivityId(items[0].id);
  }

  async function refreshLogs(){
    if(!user) return;
    const list = await listMyLogs(user.uid, date);
    setLogs(list);
  }

  React.useEffect(()=>{ loadCatalog().catch(()=>{}); }, [term]);
  React.useEffect(()=>{ refreshLogs().catch(()=>{}); }, [user, date]);

  async function onAdd(e){
    e.preventDefault();
    if(!user){ setToast({ message:"Önce giriş yap.", type:"error" }); return; }
    setLoading(true);
    try{
      const res = await addLog({ uid:user.uid, activityId, quantity: qty, date, proofFile: proof });
      setToast({ message:`Kaydedildi. CO₂: ${res.co2} kg — GaiaCredit +${res.creditDelta}`, type:"info" });
      setProof(null);
      await refreshLogs();
    }catch(err){
      setToast({ message: err?.message || "Hata", type:"error" });
    }finally{ setLoading(false); }
  }

  const total = logs.reduce((s,l)=>s + Number(l.calculatedCO2||0), 0);

  return (
    <div className="grid2">
      <div>
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message:"", type:"info" })} />
        <Section title="Karbon Kaydı" subtitle="Katalogdan seç → miktar gir → CO₂ hesapla.">
          <form onSubmit={onAdd} style={{ display:"grid", gap: 10 }}>
            <div className="grid2">
              <label>
                <small className="muted">Tarih</small>
                <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
              </label>
              <label>
                <small className="muted">Ara</small>
                <input className="input" value={term} onChange={e=>setTerm(e.target.value)} placeholder="yürüyüş, enerji..." />
              </label>
            </div>

            <label>
              <small className="muted">Aktivite</small>
              <select className="input" value={activityId} onChange={e=>setActivityId(e.target.value)}>
                {catalog.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.unit})</option>
                ))}
              </select>
            </label>

            <label>
              <small className="muted">Miktar</small>
              <input className="input" type="number" value={qty} onChange={e=>setQty(e.target.value)} step="1" />
            </label>

            <label>
              <small className="muted">Kanıt (opsiyonel)</small>
              <input className="input" type="file" onChange={e=>setProof(e.target.files?.[0] || null)} />
            </label>

            <button className="btn btnPrimary" disabled={loading}>{loading ? "Kaydediliyor..." : "Ekle"}</button>
            <small className="muted">Not: Negatif CO₂ değerleri tasarruf olarak GaiaCredit kazandırır.</small>
          </form>
        </Section>
      </div>

      <Section title="Gün Özeti" subtitle="Seçilen tarih için kayıtlar.">
        <div className="row" style={{ justifyContent:"space-between" }}>
          <span className="badge">Toplam: {Math.round(total*1000)/1000} kg CO₂</span>
          <span className="badge">{logs.length} kayıt</span>
        </div>
        <div style={{ height: 10 }} />
        {logs.length === 0 ? (
          <small className="muted">Bu tarihte kayıt yok.</small>
        ) : (
          <div style={{ display:"grid", gap: 10 }}>
            {logs.map(l => (
              <div key={l.id} className="card" style={{ padding: 12, background:"rgba(255,255,255,.05)" }}>
                <div className="row" style={{ justifyContent:"space-between" }}>
                  <div style={{ fontWeight: 800 }}>{l.activityId}</div>
                  <span className="badge">{l.calculatedCO2} kg</span>
                </div>
                <small className="muted">Miktar: {l.quantity} • {l.date}</small>
                {l.proofUrl && <a href={l.proofUrl} target="_blank" rel="noreferrer" style={{ color:"#38bdf8" }}>Kanıt</a>}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
