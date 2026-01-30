import React from "react";
export default function Toast({ message, type="info", onClose }){
  if(!message) return null;
  const bg = type==="error" ? "rgba(239,68,68,.14)" : "rgba(56,189,248,.12)";
  const bd = type==="error" ? "rgba(239,68,68,.35)" : "rgba(56,189,248,.35)";
  return (
    <div className="card" style={{ padding: 12, background:bg, borderColor:bd, marginBottom: 12 }}>
      <div className="row" style={{ justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ color:"rgba(230,237,247,.92)", lineHeight: 1.45 }}>{message}</div>
        <button className="btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}
