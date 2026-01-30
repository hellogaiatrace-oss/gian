import React from "react";
import Section from "../components/Section";
import Toast from "../components/Toast";
import { useNavigate, Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { auth, googleProvider, ensureRecaptcha } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
} from "firebase/auth";

export default function AuthPage(){
  const { t } = useI18n();
  const nav = useNavigate();

  const [mode, setMode] = React.useState("login"); // login | register | phone
  const [email, setEmail] = React.useState("");
  const [pass, setPass] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [accept, setAccept] = React.useState(false);
  const [toast, setToast] = React.useState({ message:"", type:"info" });

  const [confirmResult, setConfirmResult] = React.useState(null);

  function err(e){ setToast({ message: e?.message || "Hata", type:"error" }); }

  async function onSubmit(e){
    e.preventDefault();
    try{
      if(mode === "login"){
        await signInWithEmailAndPassword(auth, email, pass);
        nav("/");
      } else if(mode === "register"){
        if(!accept) throw new Error("Kayıt için şartları kabul etmelisin.");
        await createUserWithEmailAndPassword(auth, email, pass);
        nav("/");
      }
    }catch(e){ err(e); }
  }

  async function onGoogle(){
    try{
      if(mode === "register" && !accept) throw new Error("Kayıt için şartları kabul etmelisin.");
      await signInWithPopup(auth, googleProvider);
      nav("/");
    }catch(e){ err(e); }
  }

  async function sendPhoneCode(){
    try{
      if(mode === "register" && !accept) throw new Error("Kayıt için şartları kabul etmelisin.");
      const verifier = ensureRecaptcha("recaptcha");
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmResult(result);
      setToast({ message:"Kod gönderildi. SMS kodunu gir.", type:"info" });
    }catch(e){ err(e); }
  }

  async function verifyCode(){
    try{
      if(!confirmResult) throw new Error("Önce kod gönder.");
      await confirmResult.confirm(code);
      nav("/");
    }catch(e){ err(e); }
  }

  return (
    <div style={{ maxWidth: 560, margin:"0 auto" }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message:"", type:"info" })} />
      <Section
        title={t("appName")}
        subtitle={mode==="phone" ? "Telefon ile giriş" : (mode==="login" ? t("login") : t("register"))}
        right={<span className="badge">Auth</span>}
      >
        {mode !== "phone" ? (
          <form onSubmit={onSubmit} style={{ display:"grid", gap: 10 }}>
            <label>
              <div><small className="muted">{t("email")}</small></div>
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              <div><small className="muted">{t("password")}</small></div>
              <input className="input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••" />
            </label>

            {mode === "register" && (
              <label className="row" style={{ alignItems:"flex-start" }}>
                <input type="checkbox" checked={accept} onChange={e=>setAccept(e.target.checked)} />
                <div style={{ lineHeight:1.45 }}>
                  {t("acceptTerms")} — <Link to="/terms" style={{ color:"#38bdf8" }}>{t("terms")}</Link>
                </div>
              </label>
            )}

            <button className="btn btnPrimary" type="submit">{mode==="login" ? t("login") : t("register")}</button>
            <button className="btn" type="button" onClick={onGoogle}>{t("google") || "Google"}</button>

            <div className="row" style={{ justifyContent:"space-between", flexWrap:"wrap" }}>
              <button className="btn" type="button" onClick={()=>setMode(mode==="login" ? "register" : "login")}>
                {mode==="login" ? "Kayıt ol" : "Girişe dön"}
              </button>
              <button className="btn" type="button" onClick={()=>setMode("phone")}>Telefon ile giriş</button>
            </div>
          </form>
        ) : (
          <div style={{ display:"grid", gap: 10 }}>
            <label>
              <div><small className="muted">{t("phone")}</small></div>
              <input className="input" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+90..." />
            </label>
            <div id="recaptcha"></div>
            <button className="btn btnPrimary" onClick={sendPhoneCode}>{t("sendCode")}</button>

            <label>
              <div><small className="muted">{t("code")}</small></div>
              <input className="input" value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" />
            </label>
            <button className="btn" onClick={verifyCode}>{t("verify")}</button>

            <button className="btn" onClick={()=>setMode("login")}>Geri</button>
            <small className="muted">Not: Phone Auth için Firebase Authentication'da Phone ENABLE olmalı.</small>
          </div>
        )}
      </Section>
    </div>
  );
}
