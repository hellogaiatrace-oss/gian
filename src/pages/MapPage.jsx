import React, { useState } from "react";
import Section from "../components/Section";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { motion } from "framer-motion";
import { getCountryStats } from "../services/data";
import { useAuth } from "../services/useAuth";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const cities = [
  { name:"İstanbul", coords:[28.9784, 41.0082] },
  { name:"Ankara", coords:[32.8597, 39.9334] },
  { name:"Gdańsk", coords:[18.6466, 54.3520] },
];

export default function MapPage(){
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onPick(geo){
    const name = geo?.properties?.name || "";
    if(!name) return;
    setSelected({ name });
    setLoading(true);
    try{
      const s = await getCountryStats(name);
      setStats(s);
    }catch(e){
      setStats({ error: String(e?.message || e) });
    }finally{
      setLoading(false);
    }
  }

  return (
    <Section title="Gaia View" subtitle="Şimdilik dünya + şehir pinleri + animasyon. Renkleri sonra ekleriz.">
      <div className="card" style={{ padding: 10, background:"rgba(0,0,0,.12)" }}>
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.35}}>
          <ComposableMap projectionConfig={{ scale: 160 }} style={{ width:"100%", height:"auto" }}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={()=>onPick(geo)}
                    style={{
                      default: { fill:"rgba(255,255,255,.08)", outline:"none" },
                      hover: { fill:"rgba(56,189,248,.18)", outline:"none" },
                      pressed: { fill:"rgba(34,197,94,.22)", outline:"none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {cities.map(c => (
              <Marker key={c.name} coordinates={c.coords}>
                <motion.circle
                  r={4}
                  initial={{scale:0.7,opacity:0.7}}
                  animate={{scale:[0.7,1.2,0.85],opacity:[0.6,1,0.8]}}
                  transition={{duration:1.6,repeat:Infinity}}
                  fill="rgba(34,197,94,.92)"
                />
                <text y={-10} style={{ fontSize: 10, fill:"rgba(230,237,247,.85)" }}>{c.name}</text>
              </Marker>
            ))}
          </ComposableMap>
        </motion.div>
      </div>
      {selected && (
  <div style={{ height: 12 }} />
)}
{selected && (
  <div className="card" style={{ padding: 12 }}>
    <div className="row" style={{ justifyContent:"space-between", alignItems:"center" }}>
      <strong>{selected.name}</strong>
      <span className="pill">{loading ? "…" : (stats?.totalCO2 != null ? `${stats.totalCO2} kg CO₂e` : "—")}</span>
    </div>
    <div style={{ height: 8 }} />
    {stats?.error ? (
      <div className="muted">{stats.error}</div>
    ) : (
      <div className="muted" style={{ lineHeight: 1.55 }}>
        {stats ? (
          <>
            <div>Toplam kullanıcı: <b>{stats.userCount}</b></div>
            <div>Toplam kayıt: <b>{stats.logCount}</b></div>
            <div>Ortalama: <b>{stats.avgCO2} kg CO₂e / kullanıcı</b></div>
          </>
        ) : "—"}
      </div>
    )}
    <div style={{ height: 10 }} />
    <small className="muted">Not: Ülke verileri yalnızca GaiaTrace kullanıcı verilerinden hesaplanır.</small>
  </div>
)}

<small className="muted">Not: Harita topojson'u CDN'den gelir (internet yoksa boş kalabilir).</small>
    </Section>
  );
}
