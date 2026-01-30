import React from "react";
export default function Section({ title, subtitle, right, children }){
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent:"space-between", alignItems:"flex-start", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
          {subtitle && <div style={{ marginTop: 6, color:"rgba(230,237,247,.75)", lineHeight: 1.45 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      <hr className="sep" />
      {children}
    </div>
  );
}
