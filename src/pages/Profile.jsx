import React from "react";
import Section from "../components/Section";
import Toast from "../components/Toast";
import { useAuth } from "../services/useAuth";
import { updateProfile } from "../services/data";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../services/firebase";

export default function Profile(){
  const { user, profile } = useAuth();
  const [toast, setToast] = React.useState({ message:"", type:"info" });
  const [country, setCountry] = React.useState(profile?.country || "");
  const [city, setCity] = React.useState(profile?.city || "");
  const [isPrivate, setIsPrivate] = React.useState(!!profile?.isPrivate);
  const [photo, setPhoto] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(()=>{
    setCountry(profile?.country||"");
    setCity(profile?.city||"");
    setIsPrivate(!!profile?.isPrivate);
  }, [profile?.country, profile?.city, profile?.isPrivate]);

  async function save(){
    try{
      if(!user) throw new Error("Giriş yap.");
      setSaving(true);
      const patch = { country, city, isPrivate };
      if(photo){
        const path = `profile/${user.uid}/${Date.now()}_${photo.name}`;
        const sref = ref(storage, path);
        await uploadBytes(sref, photo);
        patch.photoUrl = await getDownloadURL(sref);
      }
      await updateProfile(user.uid, patch);
      setToast({ message:"Kaydedildi ✅", type:"info" });
      setPhoto(null);
    }catch(e){
      setToast({ message:e?.message||"Hata", type:"error" });
    }finally{ setSaving(false); }
  }

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message:"", type:"info" })} />
      <Section title="Profil" subtitle="Foto, şehir/ülke, gizlilik ve GaiaCredit.">
        {!user ? (
          <small className="muted">Giriş yap.</small>
        ) : (
          <div className="grid2">
            <div className="card" style={{ padding: 12, background:"rgba(255,255,255,.05)" }}>
              <div className="row">
                <img
                  src={profile?.photoUrl || "https://api.dicebear.com/9.x/bottts/png?seed=gaia"}
                  alt="avatar"
                  style={{ width: 72, height: 72, borderRadius: 18, border:"1px solid rgba(255,255,255,.12)" }}
                />
                <div>
                  <div style={{ fontWeight: 900 }}>{profile?.email || profile?.phone || "user"}</div>
                  <div className="badge">{profile?.titleLabel || "Seed"} • {profile?.gaiaCredit ?? 0}</div>
                  <small className="muted">UID: {user.uid.slice(0,8)}…</small>
                </div>
              </div>
              <div style={{ height: 10 }} />
              <label>
                <small className="muted">Profil fotoğrafı</small>
                <input className="input" type="file" onChange={e=>setPhoto(e.target.files?.[0]||null)} />
              </label>
            </div>

            <div className="card" style={{ padding: 12, background:"rgba(255,255,255,.05)" }}>
              <label>
                <small className="muted">Ülke</small>
                <input className="input" value={country} onChange={e=>setCountry(e.target.value)} placeholder="Türkiye" />
              </label>
              <div style={{ height: 10 }} />
              <label>
                <small className="muted">Şehir</small>
                <input className="input" value={city} onChange={e=>setCity(e.target.value)} placeholder="İstanbul" />
              </label>
              <div style={{ height: 10 }} />
              <label className="row" style={{ alignItems:"flex-start" }}>
                <input type="checkbox" checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)} />
                <div style={{ lineHeight:1.45 }}>
                  <b>Gizli profil</b><br/>
                  <small className="muted">Gizliyse bağlantı isteği olmadan DM/bağlantı olmaz.</small>
                </div>
              </label>
              <div style={{ height: 10 }} />
              <button className="btn btnPrimary" onClick={save} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
