import React from "react";
import Section from "../components/Section";
import Toast from "../components/Toast";
import { useAuth, isAdmin } from "../services/useAuth";
import { addTale } from "../services/data";

export default function Admin(){
  const { profile } = useAuth();
  const [toast, setToast] = React.useState({ message:"", type:"info" });
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [age, setAge] = React.useState("6+");
  const [tags, setTags] = React.useState("doğa,gaia");

  async function onAdd(e){
    e.preventDefault();
    try{
      await addTale({ title, body, age, tags: tags.split(",").map(s=>s.trim()).filter(Boolean) });
      setTitle(""); setBody("");
      setToast({ message:"Masal eklendi ✅", type:"info" });
    }catch(err){
      setToast({ message: err?.message || "Hata", type:"error" });
    }
  }

  if(!isAdmin(profile)){
    return <Section title="Admin" subtitle="Bu sayfa sadece admin içindir."><small className="muted">Yetkin yok.</small></Section>;
  }

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={()=>setToast({ message:"", type:"info" })} />
      <Section title="Admin Panel" subtitle="Masal ekleme (demo). Sonra katalog/aktivite yönetimini genişleteceğiz.">
        <form onSubmit={onAdd} style={{ display:"grid", gap: 10 }}>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Masal başlığı" />
          <textarea className="input" rows={8} value={body} onChange={e=>setBody(e.target.value)} placeholder="Masal metni..." />
          <div className="grid2">
            <input className="input" value={age} onChange={e=>setAge(e.target.value)} placeholder="Yaş: 6+" />
            <input className="input" value={tags} onChange={e=>setTags(e.target.value)} placeholder="etiketler: doğa,gaia" />
          </div>
          <button className="btn btnPrimary" type="submit">Ekle</button>
        </form>
      </Section>
    </div>
  );
}
