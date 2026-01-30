import React from "react";
import Section from "../components/Section";
import Toast from "../components/Toast";
import TopBar from "../components/TopBar";
import VideoEditorModal from "../components/VideoEditorModal";
import { useAuth } from "../services/useAuth";
import { 
  createPost, listFeedForUser, likePost, commentPost, listComments, 
  createChatStory, listChatStories,
  uploadUserMedia, echoPost, searchUsers, requestConnection
} from "../services/data";
import { useI18n } from "../i18n/useI18n";

export default function Chat(){
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [toast, setToast] = React.useState({ message:"", type:"info" });

  const [feed, setFeed] = React.useState([]);
  const [moments, setMoments] = React.useState([]);

  // Composer
  const [text, setText] = React.useState("");
  const [visibility, setVisibility] = React.useState("public"); // public | connections | private (UI)
  const [mediaFile, setMediaFile] = React.useState(null);
  const [mediaKind, setMediaKind] = React.useState(null); // image|video|audio
  const [videoMeta, setVideoMeta] = React.useState(null); // effects/audio/trim metadata from editor
  const [openVideoEditor, setOpenVideoEditor] = React.useState(false);

  // Moments
  const [momentText, setMomentText] = React.useState("");
  const [momentFile, setMomentFile] = React.useState(null);
  const [momentKind, setMomentKind] = React.useState(null);

  // Comments
  const [openComments, setOpenComments] = React.useState({});
  const [comments, setComments] = React.useState({});
  const [commentInput, setCommentInput] = React.useState({});

  // Search users quick
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [searchOpen, setSearchOpen] = React.useState(false);

  const visibilityMap = {
    public: "public",
    connections: "public", // simplified (connections feed implemented later with rules)
    private: "private"
  };

  async function refresh(){
    try{
      const f = await listFeedForUser({ uid: user.uid, limitN: 60, visibility:"public" });
      setFeed(f);
      const s = await listChatStories({ visibility:"public" });
      setMoments(s);
    }catch(e){
      setToast({ message:e.message, type:"error" });
    }
  }

  React.useEffect(()=>{ refresh(); },[]);

  function detectKind(file){
    if(!file) return null;
    if(file.type.startsWith("image/")) return "image";
    if(file.type.startsWith("video/")) return "video";
    if(file.type.startsWith("audio/")) return "audio";
    return "file";
  }

  async function handlePublish(){
    try{
      let media = null;
      let effects = null;
      if(mediaFile){
        const kind = mediaKind || detectKind(mediaFile) || "file";
        media = await uploadUserMedia({ uid:user.uid, file: mediaFile, kind });
        if(kind==="video" && videoMeta){
          effects = videoMeta;
        }
      }
      await createPost({ uid:user.uid, text, visibility: visibilityMap[visibility] || "public", media, effects, language: lang, type:"share" });
      setText("");
      setMediaFile(null);
      setMediaKind(null);
      setVideoMeta(null);
      setToast({ message:"Paylaşım yayınlandı.", type:"success" });
      await refresh();
    }catch(e){
      setToast({ message:e.message, type:"error" });
    }
  }

  async function handleCreateMoment(){
    try{
      let media = null;
      if(momentFile){
        const kind = momentKind || detectKind(momentFile) || "file";
        media = await uploadUserMedia({ uid:user.uid, file: momentFile, kind });
      }
      await createChatStory({ uid:user.uid, text: momentText, media, visibility:"public", language: lang });
      setMomentText("");
      setMomentFile(null);
      setMomentKind(null);
      setToast({ message:"Gaia Moment paylaşıldı.", type:"success" });
      await refresh();
    }catch(e){
      setToast({ message:e.message, type:"error" });
    }
  }

  async function toggleComments(postId){
    setOpenComments(s=>({ ...s, [postId]: !s[postId] }));
    if(!comments[postId]){
      const list = await listComments(postId);
      setComments(m=>({ ...m, [postId]: list }));
    }
  }

  async function sendComment(postId){
    try{
      const text = commentInput[postId] || "";
      await commentPost({ postId, uid:user.uid, text });
      const list = await listComments(postId);
      setComments(m=>({ ...m, [postId]: list }));
      setCommentInput(m=>({ ...m, [postId]:"" }));
      await refresh();
    }catch(e){
      setToast({ message:e.message, type:"error" });
    }
  }

  async function doEcho(postId){
    try{
      const note = prompt(t("promptEchoNote")) || "";
      await echoPost({ uid:user.uid, postId, note, visibility:"public", language: lang });
      setToast({ message:"Yankılandı.", type:"success" });
      await refresh();
    }catch(e){
      setToast({ message:e.message, type:"error" });
    }
  }

  async function doSearch(){
    try{
      const list = await searchUsers({ qText:q, limitN: 20 });
      setResults(list);
    }catch(e){
      setToast({ message:e.message, type:"error" });
    }
  }

  return (
    <div className="page">
      <TopBar title={t("social")} right={
        <button className="btn ghost" onClick={()=>setSearchOpen(o=>!o)}>{t("search")}</button>
      } />

      {searchOpen && (
        <Section title={t("findPeople")}>
          <div className="row">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t("searchPlaceholder")} />
            <button className="btn" onClick={doSearch}>{t("search")}</button>
          </div>
          <div className="list">
            {results.map(u=>(
              <div key={u.uid} className="cardRow">
                <div className="avatar small" aria-hidden />
                <div className="grow">
                  <div className="strong">{u.username || u.email || u.uid}</div>
                  <div className="muted small">{[u.country,u.city].filter(Boolean).join(" • ")}</div>
                </div>
                <button className="btn" onClick={async()=>{ await requestConnection({ fromUid:user.uid, toUid:u.uid }); setToast({message:t("requestSent"), type:"success"}); }}>{t("connect")}</button>
              </div>
            ))}
            {results.length===0 && <div className="muted small">{t("noResults")}</div>}
          </div>
        </Section>
      )}

      <Section title={t("publish")}>
        <div className="row">
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={t("sharePlaceholder")} rows={3} />
        </div>

        <div className="row wrap">
          <label className="btn ghost">
            {t("addMedia")}
            <input className="hidden" type="file" accept="image/*,video/*,audio/*" onChange={(e)=>{
              const f=e.target.files?.[0]||null;
              setMediaFile(f);
              const k=detectKind(f);
              setMediaKind(k);
              setVideoMeta(null);
            }} />
          </label>

          <select value={visibility} onChange={e=>setVisibility(e.target.value)}>
            <option value="public">{t("public")}</option>
            <option value="connections">{t("connections")}</option>
            <option value="private">{t("private")}</option>
          </select>

          {mediaKind==="video" && mediaFile && (
            <button className="btn" onClick={()=>setOpenVideoEditor(true)}>{t("editVideo")}</button>
          )}

          <button className="btn primary" onClick={handlePublish}>{t("publish")}</button>
        </div>

        {mediaFile && (
          <div className="previewCard">
            <div className="small muted">{t("selected")}: {mediaFile.name}</div>
            {mediaKind==="image" && <img className="imgPreview" src={URL.createObjectURL(mediaFile)} alt="" />}
            {mediaKind==="audio" && <audio controls src={URL.createObjectURL(mediaFile)} />}
            {mediaKind==="video" && <video className="videoThumb" controls src={URL.createObjectURL(mediaFile)} />}
            {mediaKind==="video" && videoMeta?.effects?.css && (
              <div className="small">{t("effectsApplied")}: {videoMeta.effects.effectIds?.length || 0}</div>
            )}
          </div>
        )}
      </Section>

      <Section title={t("gaiaMoments")}>
        <div className="row">
          <input value={momentText} onChange={e=>setMomentText(e.target.value)} placeholder={t("momentPlaceholder")} />
        </div>
        <div className="row wrap">
          <label className="btn ghost">
            {t("addMedia")}
            <input className="hidden" type="file" accept="image/*,video/*" onChange={(e)=>{
              const f=e.target.files?.[0]||null;
              setMomentFile(f);
              setMomentKind(detectKind(f));
            }} />
          </label>
          <button className="btn primary" onClick={handleCreateMoment}>{t("shareMoment")}</button>
        </div>

        <div className="stories">
          {moments.map(s=>(
            <div key={s.id} className="storyCard">
              <div className="storyTop">
                <div className="avatar tiny" aria-hidden />
                <div className="muted small">{new Date((s.createdAt?.toMillis?.()||Date.now())).toLocaleString()}</div>
              </div>
              <div className="storyBody">
                {s.text ? <div>{s.text}</div> : null}
                {s.media?.kind==="image" && <img className="imgPreview" src={s.media.url} alt="" />}
                {s.media?.kind==="video" && <video className="videoThumb" controls src={s.media.url} />}
              </div>
            </div>
          ))}
          {moments.length===0 && <div className="muted small">{t("noMoments")}</div>}
        </div>
      </Section>

      <Section title={t("feed")}>
        <div className="feed">
          {feed.map(p=>(
            <div key={p.id} className="postCard">
              <div className="postHead">
                <div className="avatar small" aria-hidden />
                <div className="grow">
                  <div className="strong">{p.type==="echo" ? t("echo") : t("share")}</div>
                  <div className="muted small">{new Date((p.createdAt?.toMillis?.()||Date.now())).toLocaleString()}</div>
                </div>
                <button className="btn ghost" onClick={()=>doEcho(p.id)}>{t("echo")}</button>
              </div>

              {p.type==="echo" && p.originalPostId && (
                <div className="echoHint">{t("echoOf")}: {p.originalPostId}</div>
              )}

              {p.text ? <div className="postText">{p.text}</div> : null}

              {p.media?.kind==="image" && <img className="imgPreview" src={p.media.url} alt="" />}
              {p.media?.kind==="audio" && <audio controls src={p.media.url} />}
              {p.media?.kind==="video" && (
                <div className="videoWrap">
                  <video className="videoThumb" controls src={p.media.url} />
                  {p.effects?.audio?.url && (
                    <div className="audioOverlay">
                      <div className="small muted">{t("audioAttached")}</div>
                      <audio controls src={p.effects.audio.url} />
                    </div>
                  )}
                  {p.effects?.effects?.css && (
                    <div className="small muted">{t("effectsApplied")}</div>
                  )}
                </div>
              )}

              <div className="postActions">
                <button className="btn" onClick={async()=>{ await likePost(p.id, user.uid); await refresh(); }}>{t("inspire")} • {p.likeCount||0}</button>
                <button className="btn ghost" onClick={()=>toggleComments(p.id)}>{t("comments")} • {p.commentCount||0}</button>
              </div>

              {openComments[p.id] && (
                <div className="comments">
                  {(comments[p.id]||[]).map(c=>(
                    <div key={c.id} className="commentRow">
                      <div className="avatar tiny" aria-hidden />
                      <div className="grow">
                        <div className="small">{c.text}</div>
                        <div className="muted tiny">{new Date((c.createdAt?.toMillis?.()||Date.now())).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  <div className="row">
                    <input value={commentInput[p.id]||""} onChange={e=>setCommentInput(m=>({ ...m, [p.id]: e.target.value }))} placeholder={t("writeComment")} />
                    <button className="btn primary" onClick={()=>sendComment(p.id)}>{t("send")}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {feed.length===0 && <div className="muted small">{t("noFeed")}</div>}
        </div>
      </Section>

      <VideoEditorModal 
        open={openVideoEditor} 
        onClose={()=>setOpenVideoEditor(false)} 
        videoFile={mediaFile}
        onDone={(meta)=>setVideoMeta(meta)}
      />

      <Toast toast={toast} onClose={()=>setToast({ message:"", type:"info" })} />
    </div>
  );
}
