export const titleThresholds = [
  { key: "seed", min: 0 },
  { key: "sprout", min: 120 },
  { key: "guardian", min: 600 },
  { key: "architect", min: 1500 },
];

const tr = {
  seed: "Seed",
  sprout: "Sprout",
  guardian: "Gaia Guardian",
  architect: "Earth Architect"
};

const en = {
  seed: "Seed",
  sprout: "Sprout",
  guardian: "Gaia Guardian",
  architect: "Earth Architect"
};

// Country-specific label overrides (example)
export const countryOverrides = {
  TR: { guardian: "Toprak Koruyucusu" },
};

export function pickTitle(gaiaCredit, countryCode, lang="tr"){
  let key = "seed";
  for(const t of titleThresholds){
    if(gaiaCredit >= t.min) key = t.key;
  }
  const base = (lang === "en") ? en : tr;
  const ov = countryOverrides[countryCode || ""] || {};
  return { key, label: ov[key] || base[key] || key };
}
