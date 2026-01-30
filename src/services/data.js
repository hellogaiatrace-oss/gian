import { db, storage } from "./firebase";
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, query, where, orderBy,
  serverTimestamp, increment, limit
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { pickTitle } from "./titles";

// ------- Catalog (admin seeds) -------
export async function ensureDefaultCatalog(){
  // Seed a small catalog only if empty (safe).
  const snap = await getDocs(query(collection(db, "activities_catalog"), limit(1)));
  if(!snap.empty) return;

  const items = [
    { id:"walk", name:"Yürüyüş (araba yerine)", category:"transport", unit:"km", emissionFactor: -0.20, description:"Araba yerine yürümek (yaklaşık tasarruf)", requiresProof:false, createdBy:"admin" },
    { id:"public_transport", name:"Toplu taşıma tercih", category:"transport", unit:"km", emissionFactor: -0.12, description:"Özel araç yerine toplu taşıma (tasarruf yaklaşımı)", requiresProof:false, createdBy:"admin" },
    { id:"led", name:"LED ampul kullanımı", category:"energy", unit:"kWh", emissionFactor: -0.35, description:"Verimli aydınlatma ile tasarruf", requiresProof:false, createdBy:"admin" },
    { id:"recycle", name:"Geri dönüşüm", category:"waste", unit:"item", emissionFactor: -0.05, description:"Geri dönüşüm katkısı (yaklaşık)", requiresProof:false, createdBy:"admin" },
  ];
  for(const it of items){
    await setDoc(doc(db, "activities_catalog", it.id), { ...it });
  }
}

export async function searchCatalog(term=""){
  const all = await getDocs(collection(db, "activities_catalog"));
  const t = term.trim().toLowerCase();
  return all.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(a => !t || (a.name || "").toLowerCase().includes(t) || (a.category||"").toLowerCase().includes(t));
}

// ------- Carbon logs -------
export function calcCO2(activity, quantity){
  const q = Number(quantity || 0);
  const f = Number(activity?.emissionFactor || 0);
  return Math.round(q * f * 1000) / 1000;
}

export async function addLog({ uid, activityId, quantity, date, proofFile }){
  const aRef = doc(db, "activities_catalog", activityId);
  const aSnap = await getDoc(aRef);
  if(!aSnap.exists()) throw new Error("Aktivite bulunamadı.");
  const activity = { id: aSnap.id, ...aSnap.data() };

  const co2 = calcCO2(activity, quantity);

  let proofUrl = null;
  if(proofFile){
    const path = `proof/${uid}/${Date.now()}_${proofFile.name}`;
    const sref = ref(storage, path);
    await uploadBytes(sref, proofFile);
    proofUrl = await getDownloadURL(sref);
  }

  await addDoc(collection(db, "user_logs"), {
    userId: uid,
    activityId: activity.id,
    quantity: Number(quantity),
    calculatedCO2: co2,
    date,
    proofUrl,
    createdAt: serverTimestamp()
  });

  // GaiaCredit: reward savings (negative co2 -> positive credit), clamp
  const delta = Math.max(0, Math.round((-co2) * 50)); // 0.2kg -> 10 credits
  if(delta > 0){
    await updateUserCredit(uid, delta);
  }
  return { co2, creditDelta: delta };
}

export async function listMyLogs(uid, date){
  const q = query(
    collection(db, "user_logs"),
    where("userId","==",uid),
    where("date","==",date),
    orderBy("createdAt","desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateUserCredit(uid, add){
  const uref = doc(db, "users", uid);
  await updateDoc(uref, { gaiaCredit: increment(add) });
  const snap = await getDoc(uref);
  const d = snap.data() || {};
  const picked = pickTitle(d.gaiaCredit || 0, (d.countryCode||""), (localStorage.getItem("lang")||"tr"));
  await updateDoc(uref, { titleKey: picked.key, titleLabel: picked.label });
}

// ------- Profile -------
export async function updateProfile(uid, patch){
  const uref = doc(db, "users", uid);
  await updateDoc(uref, patch);
}

// ------- Connections (Bağlantı) -------
export async function sendConnectionRequest(fromUid, toUid){
  if(fromUid === toUid) throw new Error("Kendine bağlanamazsın.");
  const ref1 = doc(db, "connection_requests", `${fromUid}_${toUid}`);
  await setDoc(ref1, {
    fromUid, toUid,
    status: "pending",
    createdAt: serverTimestamp()
  }, { merge: true });
}

export async function cancelConnectionRequest(fromUid, toUid){
  const ref1 = doc(db, "connection_requests", `${fromUid}_${toUid}`);
  await updateDoc(ref1, { status: "cancelled", updatedAt: serverTimestamp() });
}

export async function listIncomingRequests(uid){
  const q = query(collection(db, "connection_requests"), where("toUid","==",uid), where("status","==","pending"), orderBy("createdAt","desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function respondRequest(reqId, accept){
  const rref = doc(db, "connection_requests", reqId);
  const snap = await getDoc(rref);
  if(!snap.exists()) throw new Error("İstek yok.");
  const r = snap.data();
  await updateDoc(rref, { status: accept ? "accepted" : "rejected", updatedAt: serverTimestamp() });
  if(accept){
    // create connection docs for both users
    await setDoc(doc(db, "connections", `${r.fromUid}_${r.toUid}`), { a:r.fromUid, b:r.toUid, createdAt: serverTimestamp() });
  }
}

export async function isConnected(uidA, uidB){
  const q = query(collection(db, "connections"), where("a","in",[uidA, uidB])); // quick scan (small scale)
  const snap = await getDocs(q);
  const pairs = snap.docs.map(d => d.data());
  return pairs.some(p => (p.a===uidA && p.b===uidB) || (p.a===uidB && p.b===uidA));
}

// ------- GaiaChat (public posts) -------
export async function createPost({ uid, text, visibility="public", media=null, effects=null, language=null, type="share", originalPostId=null }){
  const clean = (text||"").trim();
  if(clean.length < 1 && !media) throw new Error("Paylaşım boş olamaz.");
  const docData = {
    uid,
    type, // "share" | "echo"
    originalPostId: originalPostId || null,
    text: clean,
    visibility,
    language: language || null,
    media: media || null, // { kind:"image"|"video"|"audio", url, name, meta }
    effects: effects || null, // metadata only
    createdAt: serverTimestamp(),
    likeCount: 0,
    echoCount: 0,
    commentCount: 0
  };
  await addDoc(collection(db, "social_posts"), docData);
}


export async function listPosts({ limitN=50, visibility="public" } = {}){
  // Prefer new collection, fallback to legacy.
  const q1 = query(collection(db, "social_posts"), where("visibility","==",visibility), orderBy("createdAt","desc"), limit(limitN));
  const snap1 = await getDocs(q1);
  if(!snap1.empty){
    return snap1.docs.map(d => ({ id:d.id, ...d.data() }));
  }
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt","desc"), limit(limitN)));
  return snap.docs.map(d => ({ id:d.id, type:"share", visibility:"public", ...d.data() }));
}


export async function likePost(postId, uid){
  const likeRef = doc(db, "post_likes", `${postId}_${uid}`);
  const likeSnap = await getDoc(likeRef);
  if(likeSnap.exists()) return;
  await setDoc(likeRef, { postId, uid, createdAt: serverTimestamp() });
  // update counts
  const pRefNew = doc(db, "social_posts", postId);
  await updateDoc(pRefNew, { likeCount: increment(1) }).catch(()=>{});
  // store simple user signal
  const sigRef = doc(db, "user_signals", uid);
  await setDoc(sigRef, { likedAt: serverTimestamp(), likeEvents: increment(1) }, { merge:true }).catch(()=>{});
}


export async function commentPost({ postId, uid, text }){
  const clean = (text||"").trim();
  if(clean.length < 1) throw new Error("Boş yorum olmaz.");
  await addDoc(collection(db, "post_comments"), { postId, uid, text: clean, createdAt: serverTimestamp() });
  const pRef = doc(db, "social_posts", postId);
  await updateDoc(pRef, { commentCount: increment(1) }).catch(()=>{});
}


export async function listComments(postId){
  const q = query(collection(db, "post_comments"), where("postId","==",postId), orderBy("createdAt","asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ------- Chat stories (quick shares) -------
export async function createChatStory({ uid, text, media=null, visibility="public", language=null }){
  const clean = (text||"").trim();
  const expiresAtMs = Date.now() + 24*60*60*1000;
  if(clean.length < 1 && !media) throw new Error("Boş an olmaz.");
  await addDoc(collection(db, "gaia_moments"), { 
    uid, 
    text: clean, 
    media: media || null,
    visibility,
    language: language || null,
    createdAt: serverTimestamp(), 
    expiresAtMs 
  });
}


export async function listChatStories({ visibility="public" } = {}){
  const snap = await getDocs(query(collection(db, "gaia_moments"), where("visibility","==",visibility), orderBy("createdAt","desc"), limit(50)));
  const now = Date.now();
  return snap.docs.map(d=>({ id:d.id, ...d.data() })).filter(s => (s.expiresAtMs||0) > now);
}


// ------- Masallar (admin adds) -------
export async function listTales(){
  const snap = await getDocs(query(collection(db, "tales"), orderBy("createdAt","desc"), limit(50)));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
export async function addTale({ title, body, age="6+", tags=[] }){
  await addDoc(collection(db, "tales"), { title, body, age, tags, createdAt: serverTimestamp() });
}

// ------- Media upload (Seviye 2: user uploads own files) -------
export async function uploadUserMedia({ uid, file, kind }){
  const safeName = (file?.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `user_media/${uid}/${Date.now()}_${safeName}`;
  const r = ref(storage, storagePath);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  return { kind, url, name: file?.name || safeName, meta: { size: file?.size || null, type: file?.type || null } };
}

// ------- User profiles (rich but user-controlled) -------
export async function upsertUserProfile({ uid, patch }){
  const refDoc = doc(db, "user_profiles", uid);
  await setDoc(refDoc, { uid, ...patch, updatedAt: serverTimestamp() }, { merge:true });
}
export async function getUserProfile(uid){
  const snap = await getDoc(doc(db, "user_profiles", uid));
  return snap.exists() ? snap.data() : null;
}
export async function searchUsers({ qText="", country=null, city=null, limitN=20 }){
  const q = (qText||"").trim().toLowerCase();
  // Firestore doesn't support "contains" without indexing strategy; we do prefix search on usernameLower.
  let qq = query(collection(db, "user_profiles"), orderBy("usernameLower"), limit(limitN));
  const snap = await getDocs(qq);
  const all = snap.docs.map(d=>d.data());
  return all.filter(u=>{
    if(country && (u.country||"")!==country) return false;
    if(city && (u.city||"")!==city) return false;
    if(!q) return true;
    return (u.usernameLower||"").includes(q) || (u.displayNameLower||"").includes(q);
  }).slice(0, limitN);
}

// ------- Connections (followers-like, but "bağlantı") -------
export async function requestConnection({ fromUid, toUid }){
  if(fromUid===toUid) throw new Error("Kendinle bağlantı kurulamaz.");
  const reqId = `${fromUid}_${toUid}`;
  await setDoc(doc(db,"connections", reqId), { fromUid, toUid, status:"pending", createdAt: serverTimestamp() }, { merge:true });
}
export async function respondConnection({ fromUid, toUid, accept }){
  const reqId = `${fromUid}_${toUid}`;
  await updateDoc(doc(db,"connections", reqId), { status: accept ? "accepted" : "rejected", respondedAt: serverTimestamp() });
}
export async function listConnections(uid){
  const snap = await getDocs(query(collection(db,"connections"), where("status","==","accepted"), orderBy("createdAt","desc"), limit(200)));
  const all = snap.docs.map(d=>d.data());
  return all.filter(x=>x.fromUid===uid || x.toUid===uid);
}

// ------- Echo (Yankı) repost -------
export async function echoPost({ uid, postId, note = "", visibility = "public", language = null }) {
  const pRef = doc(db, "social_posts", postId);
  const pSnap = await getDoc(pRef);
  if (!pSnap.exists()) throw new Error("Paylaşım bulunamadı.");
  await createPost({
    uid,
    text: (note || "").trim(),
    visibility,
    language,
    type: "echo",
    originalPostId: postId,
    media: null,
    effects: null
  });
  await updateDoc(pRef, { echoCount: increment(1) });
  return true;
}

export async function createTimeCapsule({ uid, title, body, openAtMs, visibility="private", language=null }){
  const t = (title||"").trim();
  const b = (body||"").trim();
  if(t.length<1 && b.length<1) throw new Error("Kapsül boş olamaz.");
  await addDoc(collection(db,"time_capsules"), { uid, title:t, body:b, openAtMs, visibility, language: language||null, createdAt: serverTimestamp() });
}
export async function listTimeCapsules(uid){
  const snap = await getDocs(query(collection(db,"time_capsules"), where("uid","==",uid), orderBy("createdAt","desc"), limit(100)));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}

// ------- Effects library -------
export async function createEffect({ uid, name, description="", recipe, visibility="public" }){
  const n=(name||"").trim();
  if(n.length<2) throw new Error("Efekt adı çok kısa.");
  await addDoc(collection(db,"effects"), { uid, name:n, description:(description||"").trim(), recipe, visibility, createdAt: serverTimestamp(), useCount:0 });
}
export async function listEffects({ visibility="public", limitN=100 } = {}){
  const snap = await getDocs(query(collection(db,"effects"), where("visibility","==",visibility), orderBy("createdAt","desc"), limit(limitN)));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
}
export async function incrementEffectUse(effectId){
  await updateDoc(doc(db,"effects", effectId), { useCount: increment(1) }).catch(()=>{});
}

// ------- Algorithmic feed (client-side scoring on top of Firestore) -------

export async function getCountryStats(countryName){
  const profSnap = await getDocs(query(collection(db, "user_profiles"), limit(600)));
  const users = profSnap.docs.map(d=>d.data()).filter(u => (u.country||"") === countryName);
  const userIds = users.map(u=>u.uid).filter(Boolean);
  if(userIds.length === 0){
    return { country: countryName, userCount: 0, logCount: 0, totalCO2: 0, avgCO2: 0 };
  }
  let logs = [];
  for(let i=0;i<userIds.length;i+=10){
    const batch = userIds.slice(i,i+10);
    const snap = await getDocs(query(collection(db, "user_logs"), where("userId","in",batch), limit(2500)));
    logs = logs.concat(snap.docs.map(d=>d.data()));
  }
  const total = Math.round((logs.reduce((s,l)=>s + Number(l.calculatedCO2||0), 0))*1000)/1000;
  const avg = Math.round(((total / userIds.length) || 0)*1000)/1000;
  return { country: countryName, userCount: userIds.length, logCount: logs.length, totalCO2: total, avgCO2: avg };
}

export async function listFeedForUser({ uid, limitN=60, visibility="public" }){
  const base = await listPosts({ limitN: 200, visibility });
  // get user signals/profile
  const prof = await getUserProfile(uid);
  const prefs = prof?.feedPrefs || {};
  const preferVideo = !!prefs.preferVideo;
  const preferText = !!prefs.preferText;

  function score(p){
    let s = 0;
    // recency
    const ts = p.createdAt?.toMillis ? p.createdAt.toMillis() : 0;
    const ageH = ts ? (Date.now()-ts)/3600000 : 9999;
    s += Math.max(0, 72 - ageH); // up to 72 points for very recent
    // engagement
    s += (p.likeCount||0) * 0.6;
    s += (p.echoCount||0) * 0.8;
    s += (p.commentCount||0) * 0.4;
    // format preference
    if(p.media?.kind==="video" && preferVideo) s += 10;
    if((!p.media || p.media.kind!=="video") && preferText) s += 5;
    // local preference
    if(prof?.country && p.country && p.country===prof.country) s += 4;
    if(prof?.city && p.city && p.city===prof.city) s += 3;
    // keep "silent valuable" chance: low engagement but recent
    if((p.likeCount||0)<1 && ageH<12) s += 2;
    return s;
  }
  // We allow posts without createdAt in rare cases; score will be low
  const ranked = base
    .filter(p=>p.visibility===visibility)
    .sort((a,b)=>score(b)-score(a))
    .slice(0, limitN);
  return ranked;
}
