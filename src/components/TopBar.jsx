import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth, isAdmin } from "../services/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useI18n } from "../i18n/useI18n";

function Item({ to, children }){
  return (
    <NavLink to={to} style={({isActive})=>({
      textDecoration:"none",
      padding:"8px 10px",
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.10)",
      background:isActive?"rgba(255,255,255,.12)":"rgba(255,255,255,.06)"
    })}>
      {children}
    </NavLink>
  );
}

export default function TopBar(){
  const { user, profile } = useAuth();
  const { t } = useI18n();
  return (
    <div className="card" style={{ padding: 12, position:"sticky", top: 10, zIndex: 10, backdropFilter:"blur(10px)" }}>
      <div className="row" style={{ justifyContent:"space-between", flexWrap:"wrap" }}>
        <Link to="/" style={{ textDecoration:"none" }} className="row">
          <img src="/logo.svg" alt="GaiaTrace" style={{ height: 28 }} />
        </Link>
        <div className="row" style={{ flexWrap:"wrap" }}>
          <Item to="/">{t("home")}</Item>
          <Item to="/carbon">{t("carbon")}</Item>
          <Item to="/chat">{t("chat")}</Item>
          <Item to="/tales">{t("tales")}</Item>
          <Item to="/map">{t("map")}</Item>
          <Item to="/settings">{t("settings")}</Item>
          <Item to="/support">{t("support")}</Item>
          <Item to="/profile">{t("profile")}</Item>
          {isAdmin(profile) && <Item to="/admin">{t("admin")}</Item>}
          {user ? (
            <button className="btn" onClick={() => signOut(auth)}>{t("logout")}</button>
          ) : (
            <Item to="/auth">{t("login")}</Item>
          )}
        </div>
      </div>
    </div>
  );
}
