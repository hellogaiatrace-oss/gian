import React from "react";
import { translations } from "./translations";

const Ctx = React.createContext(null);

export function I18nProvider({ children }){
  const [lang, setLang] = React.useState(() => localStorage.getItem("lang") || "");
  const [asked, setAsked] = React.useState(() => localStorage.getItem("langAsked") === "1");

  const t = React.useCallback((k) => (translations[lang] || translations.tr)[k] || k, [lang]);

  function chooseLanguage(l){
    setLang(l);
    localStorage.setItem("lang", l);
    localStorage.setItem("langAsked", "1");
    setAsked(true);
  }
  function updateLanguage(l){
    setLang(l);
    localStorage.setItem("lang", l);
  }

  return (
    <Ctx.Provider value={{ lang, t, asked, chooseLanguage, updateLanguage }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n(){
  const v = React.useContext(Ctx);
  if(!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
