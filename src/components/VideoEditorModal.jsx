import React from "react";
import Toast from "./Toast";
import { listEffects, createEffect, uploadUserMedia, incrementEffectUse } from "../services/data";
import { useAuth } from "../services/useAuth";
import { useI18n } from "../i18n/useI18n";
import Section from "./Section";

function cssFromRecipe(recipe){
  // recipe: { filters: [{type,value}], overlays: [] } minimal
  const filters = (recipe?.filters || []);
  const parts = [];
  for(const f of filters){
    if(!f || !f.type) continue;
    const v = f.value;
    switch(f.type){
      case "brightness": parts.push(`brightness(${v})`); break;
      case "contrast": parts.push(`contrast(${v})`); break;
      case "saturate": parts.push(`saturate(${v})`); break;
      case "hue": parts.push(`hue-rotate(${v}deg)`); break;
      case "blur": parts.push(`blur(${v}px)`); break;
      case "sepia": parts.push(`sepia(${v})`); break;
      default: break;
    }
  }
  return parts.join(" ");
}

export default function VideoEditorModal({ open, onClose, videoFile, onDone }){
  const { user } = useAuth();
  const { t } = useI18n();
  const [toast, setToast] = React.useState({ message:"", type:"info" });
  const [effects, setEffects] = React.useState([]);
  const [selected, setSelected] = React.useState([]); // array of effect objects
  const [custom, setCustom] = React.useState({ brightness:1, contrast:1, saturate:1, hue:0, blur:0, sepia:0 });
  const [audioFile, setAudioFile] = React.useState(null);
  const [trim, setTrim] = React.useState({ start:0, end:0 });
  const videoRef = React.useRef(null);
  const audioRef = React.useRef(null);

  React.useEffect(()=>{
    if(!open) return;
    (async()=>{
      try{
        const list = await listEffects({ visibility:"public", limitN: 200 });
        setEffects(list);
      }catch(e){
        setToast({ message: e.message, type:"error" });
      }
    })();
  },[open]);

  React.useEffect(()=>{
    if(!open) return;
    setSelected([]);
    setAudioFile(null);
    setTrim({ start:0, end:0 });
  },[open, videoFile]);

  if(!open) return null;

  const combinedRecipe = {
    filters: [
      ...selected.flatMap(e => e.recipe?.filters || []),
      { type:"brightness", value: custom.brightness },
      { type:"contrast", value: custom.contrast },
      { type:"saturate", value: custom.saturate },
      { type:"hue", value: custom.hue },
      { type:"blur", value: custom.blur },
      { type:"sepia", value: custom.sepia },
    ]
  };
  const filterCss = cssFromRecipe(combinedRecipe);

  async function handleCreateEffect(){
    try{
      const name = prompt(t("promptEffectName"));
      if(!name) return;
      const description = prompt(t("promptEffectDesc")) || "";
      const recipe = { filters: [
        { type:"brightness", value: custom.brightness },
        { type:"contrast", value: custom.contrast },
        { type:"saturate", value: custom.saturate },
        { type:"hue", value: custom.hue },
        { type:"blur", value: custom.blur },
        { type:"sepia", value: custom.sepia },
      ]};
      await createEffect({ uid: user.uid, name, description, recipe, visibility:"public" });
      const list = await listEffects({ visibility:"public", limitN: 200 });
      setEffects(list);
      setToast({ message:"Efekt kaydedildi.", type:"success" });
    }catch(e){
      setToast({ message:e.message, type:"error" });
    }
  }

  async function handleDone(){
    try{
      let audio = null;
      if(audioFile){
        const uploaded = await uploadUserMedia({ uid: user.uid, file: audioFile, kind:"audio" });
        audio = uploaded;
      }
      // increment use counts
      for(const e of selected){
        if(e?.id) await incrementEffectUse(e.id);
      }
      onDone({
        trim,
        audio,
        effects: {
          effectIds: selected.map(e=>e.id),
          custom: { ...custom },
          css: filterCss
        }
      });
      onClose();
    }catch(e){
      setToast({ message:e.message, type:"error" });
    }
  }

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalCard" onClick={(e)=>e.stopPropagation()}>
        <div className="modalHeader">
          <div className="modalTitle">Video Düzenle</div>
          <button className="btn ghost" onClick={onClose}>Kapat</button>
        </div>

        <Section title="Önizleme">
          <div className="videoPreview">
            <video
              ref={videoRef}
              className="videoEl"
              style={{ filter: filterCss }}
              src={URL.createObjectURL(videoFile)}
              controls
            />
          </div>
          <div className="hint">Not: Efektler önizleme ve kayıt metadatası olarak saklanır.</div>
        </Section>

        <Section title="Trim (basit)">
          <div className="grid2">
            <label className="field">
              <span>Başlangıç (sn)</span>
              <input type="number" min="0" step="0.1" value={trim.start} onChange={e=>setTrim(t=>({...t, start: Number(e.target.value)}))} />
            </label>
            <label className="field">
              <span>Bitiş (sn, 0=otomatik)</span>
              <input type="number" min="0" step="0.1" value={trim.end} onChange={e=>setTrim(t=>({...t, end: Number(e.target.value)}))} />
            </label>
          </div>
        </Section>

        <Section title="Ses / Müzik (Seviye 2)">
          <div className="row">
            <input type="file" accept="audio/*" onChange={(e)=>setAudioFile(e.target.files?.[0] || null)} />
          </div>
          {audioFile ? <div className="small">Seçilen: {audioFile.name}</div> : <div className="small muted">İstersen kendi müziğini yükle.</div>}
        </Section>

        <Section title="Efekt Kütüphanesi (sınırsız)">
          <div className="chips">
            {effects.map(e=>(
              <button
                key={e.id}
                className={"chip " + (selected.some(s=>s.id===e.id) ? "active" : "")}
                onClick={()=>{
                  setSelected(prev=>{
                    if(prev.some(s=>s.id===e.id)) return prev.filter(s=>s.id!==e.id);
                    return [...prev, e];
                  });
                }}
              >
                {e.name}
              </button>
            ))}
          </div>
          <div className="row">
            <button className="btn" onClick={handleCreateEffect}>Bu ayarlardan Efekt Üret</button>
          </div>
        </Section>

        <Section title="Özel Ayarlar">
          <div className="sliders">
            {[
              ["brightness","Parlaklık",0.2,2,0.05],
              ["contrast","Kontrast",0.2,2,0.05],
              ["saturate","Doygunluk",0,3,0.05],
              ["hue","Ton", -180,180,1],
              ["blur","Bulanıklık",0,10,0.2],
              ["sepia","Sepya",0,1,0.05],
            ].map(([k,label,min,max,step])=>(
              <label key={k} className="sliderRow">
                <span>{label}</span>
                <input type="range" min={min} max={max} step={step} value={custom[k]} onChange={e=>setCustom(s=>({...s, [k]: Number(e.target.value)}))}/>
                <span className="mono">{custom[k]}</span>
              </label>
            ))}
          </div>
        </Section>

        <div className="modalFooter">
          <button className="btn ghost" onClick={onClose}>Vazgeç</button>
          <button className="btn primary" onClick={handleDone}>Kaydet</button>
        </div>

        <Toast toast={toast} onClose={()=>setToast({message:"",type:"info"})} />
      </div>
    </div>
  );
}
