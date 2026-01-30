import React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const Ctx = React.createContext(null);

export function AuthProvider({ children }){
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if(!u){
        setProfile(null);
        setLoading(false);
        return;
      }
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if(!snap.exists()){
        await setDoc(ref, {
          uid: u.uid,
          email: u.email || "",
          phone: u.phoneNumber || "",
          role: "user",
          country: "",
          city: "",
          photoUrl: u.photoURL || "",
          gaiaCredit: 0,
          titleKey: "seed",
          isPrivate: false,
          createdAt: serverTimestamp(),
        }, { merge: true });
      } else {
        // merge basic identity if missing
        const d = snap.data() || {};
        const patch = {};
        if(!d.email && u.email) patch.email = u.email;
        if(!d.phone && u.phoneNumber) patch.phone = u.phoneNumber;
        if(!d.photoUrl && u.photoURL) patch.photoUrl = u.photoURL;
        if(Object.keys(patch).length) await setDoc(ref, patch, { merge: true });
      }
      const snap2 = await getDoc(ref);
      setProfile(snap2.data() || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return <Ctx.Provider value={{ user, profile, loading }}>{children}</Ctx.Provider>;
}

export function useAuth(){
  const v = React.useContext(Ctx);
  if(!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

export function isAdmin(profile){ return profile?.role === "admin"; }
