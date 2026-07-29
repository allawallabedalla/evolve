// Eigenstaendige Kopie der app/index.html-Namens-Kaskade fuer Node-Forschungsskripte
// (kein Browser/DOM verfuegbar). Nur lesend fuer Messungen genutzt - KEIN Ersatz fuer die
// echte App-Funktion, die weiterhin die einzige live genutzte Quelle ist.
export function classify(t){
  const insul=t[0],size=t[1],limb=t[2],metab=t[3],armor=t[4],photo=t[5],mob=t[6],struct=t[7],wing=t[8]||0,biolum=t[9]||0,detox=t[10]||0,oxyEff=t[11]||0,osmo=t[12]||0,burrow=t[13]||0,pigment=t[14]||0,filter=t[15]||0,camo=t[16]||0,baro=t[17]||0,sense=t[18]||0,desicc=t[19]||0,radres=t[20]||0,fireres=t[21]||0,frostres=t[22]||0,windres=t[23]||0,nfix=t[24]||0;

  // ===== Reich PFLANZEN — autotroph (Photosynthese) + sessil =====
  if(photo>0.45 && mob<0.4){
    if(size<0.18 && struct<0.32)          return {k:"Pflanze",n:"Grünalge",e:"🟢"};
    if(struct<0.28 && size<0.42)          return {k:"Pflanze",n:"Moos",e:"🌱"};
    if(armor>0.5)                         return {k:"Pflanze",n:"Sukkulente · Kaktus",e:"🌵"};
    if(insul>0.6)                         return {k:"Pflanze",n:"Polster-Kältepflanze",e:"🏔️"};
    if(struct>0.6 && size>0.5)            return insul>0.4 ? {k:"Pflanze",n:"Nadelbaum",e:"🌲"}
                                                          : {k:"Pflanze",n:"Laubbaum",e:"🌳"};
    if(struct>0.55)                       return {k:"Pflanze",n:"Verholzter Strauch",e:"🪴"};
    if(photo>0.75 && struct<0.42)         return {k:"Pflanze",n:"Blütenkraut",e:"🌸"};
    if(struct<0.42 && size>0.35)          return {k:"Pflanze",n:"Farn",e:"🌿"};
    return {k:"Pflanze",n:"Kraut · niedrige Pflanze",e:"☘️"};
  }

  // ===== Reich TIERE — heterotroph + mobil =====
  if(mob>0.45 && photo<0.4){
    // Biolumineszenz (AXIS-5) -> Tiefsee-Leuchtwesen (Anglerfisch/Qualle), aber NUR
    // wenn stromlinienförmig (Tiefsee-Schwimmer). Ein beiniger/geflügelter Leuchter an
    // dunklem Land (Glühwürmchen/Leuchtkäfer) fällt unten in seine Landform — sonst
    // hieße ein Landtier fälschlich „Tiefsee".
    if(biolum>0.55 && limb<0.3 && armor<0.35) return {k:"Tier",n:"Leuchtwesen · Tiefsee",e:"🪼"};
    // Flug-Baupläne (AXIS-1): hohe Flügelfläche + leichter, waffenloser Körper.
    if(wing>0.5 && size<0.34 && armor<0.4){
      if(metab>0.7 && insul>0.62)         return {k:"Tier",n:"Flugsäuger · Fledermaus",e:"🦇"};
      if(metab>0.7)                       return {k:"Tier",n:"Flatterer · Vogel",e:"🐦"};
      return {k:"Tier",n:"Fluginsekt · Segler",e:"🦋"};
    }
    if(armor>0.55 && size>0.55)           return {k:"Tier",n:"Gepanzerter Koloss",e:"🦏"};
    if(armor>0.5 && limb>0.5)             return {k:"Tier",n:"Krebstier · Arthropode",e:"🦀"};
    if(armor>0.55)                        return {k:"Tier",n:"Gepanzertes Beutetier",e:"🐢"};
    if(armor>0.45 && limb<0.3 && mob<0.6) return {k:"Tier",n:"Schnecke · Weichtier",e:"🐌"};
    if(limb<0.3 && armor<0.32 && mob>0.6) return {k:"Tier",n:"Fisch · Aalform",e:"🐟"};
    if(limb<0.3 && size<0.35)             return {k:"Tier",n:"Wurm",e:"🪱"};
    if(limb>0.6 && size<0.32 && insul<0.4)return {k:"Tier",n:"Insekt · Gliederfüßer",e:"🐜"};
    if(limb>0.55 && struct<0.32 && armor<0.32 && insul<0.35 && size>0.32) return {k:"Tier",n:"Kopffüßer · Tintenfisch",e:"🐙"};
    if(size>0.6 && metab>0.6)             return {k:"Tier",n:"Aktiver Großjäger",e:"🐺"};
    if(insul>0.6 && size>0.52)            return {k:"Tier",n:"Fell-Großtier",e:"🐻"};
    if(insul>0.6)                         return {k:"Tier",n:"Fell-Warmblüter",e:"🦊"};
    if(limb>0.6 && size<0.45)             return {k:"Tier",n:"Behänder Kletterer",e:"🐒"};
    if(size<0.28)                         return {k:"Tier",n:"Kleines flinkes Tier",e:"🐭"};
    if(armor<0.32 && insul<0.32 && struct<0.35 && metab<0.5) return {k:"Tier",n:"Amphibie · Lurch",e:"🐸"};
    if(armor<0.32 && insul<0.32)          return {k:"Tier",n:"Reptil · Echse",e:"🦎"};
    return {k:"Tier",n:"Generalisten-Tier",e:"🦥"};
  }

  // ===== Reich PILZE & MIKROBEN — heterotroph + sessil (fressen ohne Wandern) =====
  if(photo<0.45 && mob<0.4){
    if(size<0.16){
      if(metab>0.6 || insul>0.6)          return {k:"Mikrobe",n:"Archaee · Extremophil",e:"🦠"};
      return {k:"Mikrobe",n:"Bakterie",e:"🧫"};
    }
    if(size<0.28 && struct<0.35)          return {k:"Mikrobe",n:"Protist · Amöbe",e:"🔬"};
    if(metab>0.55 && size<0.35)           return {k:"Pilz",n:"Hefe",e:"🫧"};
    if(photo>0.28 && struct>0.5 && armor>0.4) return {k:"Tier",n:"Koralle · Riffbildner",e:"🪸"};
    if(photo>0.28)                        return {k:"Pilz",n:"Flechte · Symbiose",e:"🍥"};
    if(struct<0.3 && armor<0.3 && metab<0.45 && size>0.38) return {k:"Tier",n:"Schwamm",e:"🧽"};
    if(struct>0.55 && size>0.4)           return {k:"Pilz",n:"Baumpilz · Porling",e:"🪵"};
    if(armor>0.5)                         return {k:"Pilz",n:"Zunderschwamm",e:"🟤"};
    if(struct<0.3 && size<0.42)           return {k:"Pilz",n:"Schimmel · Fadenpilz",e:"🧵"};
    if(size>0.45)                         return {k:"Pilz",n:"Hutpilz",e:"🍄"};
    return {k:"Pilz",n:"Myzel · Pilzgeflecht",e:"🍂"};
  }

  // ===== Reich PROTISTEN — schwimmen UND Photosynthese (Mischotroph) =====
  if(size<0.2)                            return {k:"Protist",n:"Plankton",e:"✨"};
  return {k:"Protist",n:"Euglenoid · Mixotroph",e:"🦠"};
}
