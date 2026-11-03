/* EDVCODER FINANCE - logique de l'application (données, pages, interactions) */
const $ = (s) => document.querySelector(s),
  fm = (n) => Math.round(n).toLocaleString("fr-FR") + " F",
  MO = [
    "jan",
    "fév",
    "mar",
    "avr",
    "mai",
    "juin",
    "juil",
    "août",
    "sept",
    "oct",
    "nov",
    "déc",
  ];
const K = "edv_fin_v1";
let S;
try {
  S = JSON.parse(localStorage.getItem(K));
} catch (e) {}
function seed() {
  const N = [
    ["Kouassi", "Yao"],
    ["Traoré", "Aminata"],
    ["Koné", "Ibrahim"],
    ["Bamba", "Fatou"],
    ["Diallo", "Moussa"],
    ["Nguessan", "Awa"],
    ["Coulibaly", "Seydou"],
    ["Ouattara", "Mariam"],
    ["Yapi", "Christian"],
    ["Aka", "Estelle"],
    ["Kouadio", "Jean"],
    ["Soro", "Nathalie"],
  ];
  const members = N.map((n, i) => ({
    id: i + 1,
    mat: "EDV-" + String(i + 1).padStart(3, "0"),
    nom: n[0],
    pre: n[1],
    tel: "07 0" + (i % 9) + " 12 3" + i + " 4" + i,
    fn: ["Président", "Trésorier", "Secrétaire"][i] || "Membre",
    st: i == 10 ? "suspendu" : i == 7 ? "inactif" : "actif",
  }));
  const cot = members.map((m, i) => ({
    mid: m.id,
    due: 10000,
    paid: [10000, 10000, 10000, 5000, 0, 10000, 10000, 0, 0, 10000, 0, 5000][i],
    late: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0][i],
  }));
  const tx = [],
    X = [
      "Transport",
      "Communication",
      "Matériel informatique",
      "Événements",
      "Transport",
      "Salaires et prestations",
    ];
  for (let i = 0; i < 6; i++) {
    const d = (x) => `2026-${String(5 + i).padStart(2, "0")}-${x}`;
    tx.push(
      {
        id: "a" + i,
        type: "recette",
        cat: "Cotisations",
        amt: 90000 + i * 12000,
        desc: "Cotisations du mois",
        date: d("05"),
        mode: "Mobile Money",
      },
      {
        id: "b" + i,
        type: "recette",
        cat: i % 2 ? "Dons" : "Prestations de services",
        amt: 40000 + i * 9000,
        desc: "Entrée exceptionnelle",
        date: d("18"),
        mode: "Virement",
      },
      {
        id: "c" + i,
        type: "depense",
        cat: "Fonctionnement",
        amt: 35000 + i * 4000,
        desc: "Loyer et charges",
        date: d("10"),
        mode: "Espèces",
      },
      {
        id: "d" + i,
        type: "depense",
        cat: X[i],
        amt: 30000 + i * 7000,
        desc: "Dépense " + X[i].toLowerCase(),
        date: d("22"),
        mode: "Mobile Money",
      },
    );
  }
  return { members, cot, tx, open: true, n: 100 };
}
if (!S) S = seed();
const save = () => {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (e) {}
};
function toast(t) {
  const e = document.createElement("div");
  e.textContent = t;
  $("#toast").append(e);
  setTimeout(() => e.remove(), 2800);
}
const cm = () => $("#modal").classList.remove("on");
function form(title, fs, v, cb) {
  v = v || {};
  $("#mb").innerHTML =
    `<h3>${title}</h3><div class=fg>` +
    fs
      .map(
        (x) =>
          `<label>${x.l}` +
          (x.o
            ? `<select name=${x.k}>${x.o.map((o) => `<option ${v[x.k] == o ? "selected" : ""}>${o}</option>`).join("")}</select>`
            : `<input name=${x.k} type=${x.t || "text"} value="${v[x.k] ?? ""}">`) +
          `</label>`,
      )
      .join("") +
    `</div><p id=er class=er></p><div class=ac><button class="b g" onclick=cm()>Annuler</button><button class=b id=sv>Enregistrer</button></div>`;
  $("#modal").classList.add("on");
  $("#sv").onclick = () => {
    const o = {};
    for (const x of fs) {
      let e = document.querySelector(`#mb [name=${x.k}]`).value.trim();
      if (!e) {
        $("#er").textContent = "Le champ « " + x.l + " » est requis.";
        return;
      }
      if (x.t == "number") {
        e = +e;
        if (!(e > 0)) {
          $("#er").textContent = "Montant invalide.";
          return;
        }
      }
      o[x.k] = e;
    }
    cb(o);
    save();
    cm();
    go();
  };
}
const P = {},
  Q = {};
function pg(rows, k, n = 6) {
  const p = P[k] || 1,
    t = Math.max(1, Math.ceil(rows.length / n));
  if (p > t) P[k] = t;
  return {
    r: rows.slice(((P[k] || 1) - 1) * n, (P[k] || 1) * n),
    h: `<div class=pg><span class=mu style="align-self:center">${rows.length} résultat(s) · page ${P[k] || 1}/${t}</span><button class="b g sm" onclick="P['${k}']=Math.max(1,(P['${k}']||1)-1);go()">‹</button><button class="b g sm" onclick="P['${k}']=Math.min(${t},(P['${k}']||1)+1);go()">›</button></div>`,
  };
}
const bdg = (s) =>
  `<span class="bd ${{ actif: "ok", Payé: "ok", recette: "ok", inactif: "wa", suspendu: "ko", "En retard": "ko", depense: "ko", "En attente": "wa", Partiel: "in" }[s] || "in"}">${s == "depense" ? "dépense" : s}</span>`;
const sm = (t, ty) =>
    t.filter((x) => x.type == ty).reduce((a, x) => a + x.amt, 0),
  cs = (c) =>
    c.paid >= c.due
      ? "Payé"
      : c.paid > 0
        ? "Partiel"
        : c.late
          ? "En retard"
          : "En attente",
  nm = (id) => {
    const m = S.members.find((x) => x.id == id);
    return m ? m.pre + " " + m.nom : "—";
  };
let CH = [];
const mk = (id, c) => {
  try {
    CH.push(new Chart($(id), c));
  } catch (e) {}
};
const R = {},
  NAV = [
    ["dash", "▦", "Tableau de bord"],
    ["membres", "👥", "Membres"],
    ["cotis", "💳", "Cotisations"],
    ["recettes", "⬇", "Recettes"],
    ["depenses", "⬆", "Dépenses"],
    ["treso", "🏦", "Trésorerie"],
    ["rapports", "📈", "Rapports"],
    ["notifs", "🔔", "Notifications"],
  ];
function go(h) {
  if (h) location.hash = h;
  const k = (location.hash || "#dash").slice(1),
    v = R[k] ? k : "dash";
  CH.forEach((c) => c.destroy());
  CH = [];
  $("#nv").innerHTML = NAV.map(
    (n) =>
      `<a class="${n[0] == v ? "on" : ""}" onclick="sd.classList.remove('open');go('${n[0]}')">${n[1]} ${n[2]}</a>`,
  ).join("");
  $("#bc").textContent = "EDVCODER › " + NAV.find((n) => n[0] == v)[2];
  $("#v").innerHTML = R[v]();
  if (R[v].i) R[v].i();
}
window.onhashchange = () => go();
function lg() {
  if (!$("#le").value.includes("@") || $("#lp").value.length < 4)
    return toast("Identifiants invalides");
  $("#login").style.display = "none";
  toast("Bienvenue sur EDVCODER FINANCE");
}
let PER = "année";
const DAYS = { semaine: 7, mois: 31, trimestre: 92, année: 365 };
const per = () =>
  S.tx.filter(
    (x) => (new Date("2026-11-01") - new Date(x.date)) / 864e5 <= DAYS[PER],
  );
R.dash = () => {
  const T = per(),
    r = sm(T, "recette"),
    d = sm(S.tx, "depense") * 0 + sm(T, "depense"),
    due = S.cot.reduce((a, c) => a + c.due, 0),
    pd = S.cot.reduce((a, c) => a + c.paid, 0),
    solde = sm(S.tx, "recette") - sm(S.tx, "depense"),
    taux = Math.round((pd / due) * 100);
  const md = {};
  S.tx
    .filter((x) => x.type == "recette")
    .forEach((x) => (md[x.mode] = (md[x.mode] || 0) + x.amt));
  const mt = Object.values(md).reduce((a, b) => a + b, 0) || 1,
    cl = ["var(--p)", "var(--s)", "var(--ok)"];
  const hm = Array.from({ length: 35 }, (_, i) => {
    const dd = new Date("2026-11-01");
    dd.setDate(dd.getDate() - 34 + i);
    const c = S.tx.filter(
      (x) => x.date == dd.toISOString().slice(0, 10),
    ).length;
    return `<i style="opacity:${[0.12, 0.45, 0.8, 1][Math.min(c, 3)]}"></i>`;
  }).join("");
  return `<div class=top style="margin-bottom:14px"><h1>Vue d'ensemble</h1><select style="width:auto" onchange="PER=this.value;go()">${Object.keys(
    DAYS,
  )
    .map((k) => `<option ${k == PER ? "selected" : ""}>${k}</option>`)
    .join("")}</select></div>
<div class="g g4"><div class=card><span class=mu>Solde de la caisse</span><div class=big>${fm(solde)}</div></div><div class=card><span class=mu>Recettes (${PER})</span><div class=big style="color:var(--ok)">${fm(r)}</div></div><div class=card><span class=mu>Dépenses (${PER})</span><div class=big style="color:var(--ko)">${fm(d)}</div></div><div class=card><span class=mu>Membres</span><div class=big>${S.members.length}</div></div></div>
<div class="g g2"><div class=card><h3>Recettes et dépenses par mois</h3><div style="height:250px"><canvas id=c1></canvas></div></div><div class=card><h3>Volume par mode de paiement</h3><div class=big>${fm(mt)}</div>${Object.entries(
    md,
  )
    .map(
      ([k, v], i) =>
        `<div style="display:flex;justify-content:space-between"><span class=mu>${k}</span><b>${fm(v)}</b></div><div class=bar><i style="width:${(v / mt) * 100}%;background:${cl[i % 3]}"></i></div>`,
    )
    .join("")}</div></div>
<div class="g g3"><div class=card style="text-align:center"><h3 style="text-align:left">Fonds disponibles</h3><div class=big>${fm(solde)}</div><div class=coin>F</div><div style="display:flex;gap:8px"><button class=b style="flex:1" onclick="go('recettes')">Encaisser</button><button class="b g" style="flex:1" onclick="go('depenses')">Dépenser</button></div></div>
<div class=card><h3>Activité des 5 dernières semaines</h3><div class=hm>${hm}</div><p class=mu style="margin-bottom:0">Transactions par jour · cotisations en attente : ${fm(due - pd)}</p></div>
<div class=card style="text-align:center"><h3 style="text-align:left">Taux de recouvrement</h3><div style="position:relative;height:150px"><canvas id=c2></canvas><div style="position:absolute;inset:auto 0 8px;font-size:26px;font-weight:800">${taux}%</div></div></div></div>
<div class="g g2"><div class=card><h3>Dernières transactions</h3><div class=tw><table>${[
    ...S.tx,
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)
    .map(
      (x) =>
        `<tr><td>${x.date}</td><td>${x.cat}</td><td>${bdg(x.type)}</td><td><b>${fm(x.amt)}</b></td></tr>`,
    )
    .join("")}</table></div></div><div class=card><h3>Alertes</h3>${alerts()
    .slice(0, 4)
    .map((a) => `<p>${a}</p>`)
    .join("")}</div></div>`;
};
R.dash.i = () => {
  const ms = [4, 5, 6, 7, 8, 9],
    f = (t) =>
      ms.map((m) =>
        S.tx
          .filter((x) => x.type == t && +x.date.slice(5, 7) == m + 1)
          .reduce((a, x) => a + x.amt, 0),
      );
  mk("#c1", {
    type: "bar",
    data: {
      labels: ms.map((m) => MO[m]),
      datasets: [
        {
          label: "Recettes",
          data: f("recette"),
          backgroundColor: "#fd7e14",
          borderRadius: 8,
        },
        {
          label: "Dépenses",
          data: f("depense"),
          backgroundColor: "#0d6efd",
          borderRadius: 8,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { grid: { color: "#8883" } },
        x: { grid: { display: false } },
      },
    },
  });
  const pd = S.cot.reduce((a, c) => a + c.paid, 0),
    due = S.cot.reduce((a, c) => a + c.due, 0);
  mk("#c2", {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [pd, due - pd],
          backgroundColor: ["#fd7e14", "#8883"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      rotation: -90,
      circumference: 180,
      cutout: "72%",
      maintainAspectRatio: false,
      plugins: { tooltip: { enabled: false } },
    },
  });
};
const alerts = () => [
  ...S.cot
    .filter((c) => cs(c) == "En retard")
    .map((c) => `⚠️ ${nm(c.mid)} est en retard de cotisation.`),
  ...S.cot
    .filter((c) => cs(c) == "Partiel")
    .map(
      (c) =>
        `ℹ️ Paiement partiel de ${nm(c.mid)} : reste ${fm(c.due - c.paid)}.`,
    ),
  ...(S.open ? [] : ["🔒 La caisse est clôturée."]),
];
R.membres = () => {
  const q = (Q.m || "").toLowerCase(),
    f = Q.mf || "tous",
    rows = S.members.filter(
      (m) =>
        (f == "tous" || m.st == f) &&
        (m.nom + m.pre + m.mat).toLowerCase().includes(q),
    ),
    p = pg(rows, "m");
  return `<h1 style="margin-bottom:16px">Membres</h1><div class=card><div class=tb><input placeholder="Rechercher un membre…" value="${Q.m || ""}" oninput="Q.m=this.value;P.m=1;go();const i=$('.tb input');i.focus();i.setSelectionRange(99,99)"><select onchange="Q.mf=this.value;P.m=1;go()">${["tous", "actif", "inactif", "suspendu"].map((o) => `<option ${o == f ? "selected" : ""}>${o}</option>`).join("")}</select><button class=b onclick="addM()">+ Nouveau membre</button></div>
${p.r.length ? `<div class=tw><table><tr><th>Matricule</th><th>Membre</th><th>Fonction</th><th>Téléphone</th><th>Statut</th><th></th></tr>${p.r.map((m) => `<tr><td>${m.mat}</td><td><b>${m.pre} ${m.nom}</b></td><td>${m.fn}</td><td>${m.tel}</td><td>${bdg(m.st)}</td><td><button class="b g sm" onclick="tg(${m.id})">${m.st == "actif" ? "Désactiver" : "Activer"}</button> <button class="b g sm" onclick="addM(${m.id})">Modifier</button> <button class="b g sm" onclick="dl('members',${m.id})">Supprimer</button></td></tr>`).join("")}</table></div>${p.h}` : "<div class=em>Aucun membre ne correspond à votre recherche.</div>"}</div>`;
};
const MF = [
  { k: "pre", l: "Prénom" },
  { k: "nom", l: "Nom" },
  { k: "tel", l: "Téléphone" },
  {
    k: "fn",
    l: "Fonction",
    o: ["Membre", "Président", "Trésorier", "Secrétaire"],
  },
];
function addM(id) {
  const m = S.members.find((x) => x.id == id);
  form(m ? "Modifier le membre" : "Nouveau membre", MF, m, (o) => {
    if (m) Object.assign(m, o);
    else {
      const n = ++S.n;
      S.members.push({ id: n, mat: "EDV-" + n, st: "actif", ...o });
      S.cot.push({ mid: n, due: 10000, paid: 0, late: 0 });
    }
    toast("Membre enregistré");
  });
}
function tg(id) {
  const m = S.members.find((x) => x.id == id);
  m.st = m.st == "actif" ? "inactif" : "actif";
  save();
  toast("Statut mis à jour");
  go();
}
function dl(k, id) {
  if (!confirm("Confirmer la suppression ?")) return;
  S[k] = S[k].filter((x) => x.id != id);
  if (k == "members") S.cot = S.cot.filter((c) => c.mid != id);
  save();
  toast("Élément supprimé");
  go();
}
R.cotis = () => {
  const due = S.cot.reduce((a, c) => a + c.due, 0),
    pd = S.cot.reduce((a, c) => a + c.paid, 0),
    f = Q.cf || "tous",
    rows = S.cot.filter((c) => f == "tous" || cs(c) == f),
    p = pg(rows, "c");
  return `<h1 style="margin-bottom:16px">Cotisations</h1><div class="card" style="margin-bottom:16px"><h3>Campagne : Cotisation mensuelle novembre 2026</h3><div style="display:flex;justify-content:space-between"><span class=mu>Montant : 10 000 F · mensuelle · échéance 15/11/2026</span><b>${fm(pd)} / ${fm(due)}</b></div><div class=bar><i style="width:${(pd / due) * 100}%;background:var(--p)"></i></div></div>
<div class=card><div class=tb><select onchange="Q.cf=this.value;P.c=1;go()">${["tous", "Payé", "Partiel", "En attente", "En retard"].map((o) => `<option ${o == f ? "selected" : ""}>${o}</option>`).join("")}</select></div><div class=tw><table><tr><th>Membre</th><th>Attendu</th><th>Payé</th><th>Reste</th><th>Statut</th><th></th></tr>${p.r.map((c) => `<tr><td><b>${nm(c.mid)}</b></td><td>${fm(c.due)}</td><td>${fm(c.paid)}</td><td>${fm(c.due - c.paid)}</td><td>${bdg(cs(c))}</td><td>${c.paid < c.due ? `<button class="b sm" onclick="pay(${c.mid})">Encaisser</button>` : ""}</td></tr>`).join("")}</table></div>${p.h}</div>`;
};
function pay(id) {
  const c = S.cot.find((x) => x.mid == id);
  form(
    "Paiement — " + nm(id),
    [
      {
        k: "amt",
        l: "Montant (reste " + fm(c.due - c.paid) + ")",
        t: "number",
      },
    ],
    { amt: c.due - c.paid },
    (o) => {
      const a = Math.min(o.amt, c.due - c.paid);
      c.paid += a;
      const ref = "PAY-" + Date.now().toString().slice(-6);
      S.tx.push({
        id: "t" + ++S.n,
        type: "recette",
        cat: "Cotisations",
        amt: a,
        desc: "Cotisation " + nm(id) + " (" + ref + ")",
        date: "2026-11-01",
        mode: "Mobile Money",
      });
      toast("Paiement enregistré · " + ref);
    },
  );
}
function txv(ty, k) {
  const q = (Q[k] || "").toLowerCase(),
    rows = S.tx
      .filter((x) => x.type == ty && (x.cat + x.desc).toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date)),
    p = pg(rows, k),
    L = ty == "recette" ? "Recettes" : "Dépenses";
  return `<h1 style="margin-bottom:16px">${L}</h1><div class=card><div class=tb><input placeholder="Rechercher…" value="${Q[k] || ""}" oninput="Q.${k}=this.value;P.${k}=1;go();const i=$('.tb input');i.focus();i.setSelectionRange(99,99)"><button class=b onclick="addT('${ty}')">+ Nouvelle ${ty == "recette" ? "recette" : "dépense"}</button></div>${p.r.length ? `<div class=tw><table><tr><th>Date</th><th>Catégorie</th><th>Description</th><th>Mode</th><th>Montant</th><th></th></tr>${p.r.map((x) => `<tr><td>${x.date}</td><td>${x.cat}</td><td>${x.desc}</td><td>${x.mode}</td><td><b>${fm(x.amt)}</b></td><td><button class="b g sm" onclick="addT('${ty}','${x.id}')">Modifier</button> <button class="b g sm" onclick="dt('${x.id}')">Supprimer</button></td></tr>`).join("")}</table></div>${p.h}` : "<div class=em>Aucune opération enregistrée.</div>"}</div>`;
}
R.recettes = () => txv("recette", "r");
R.depenses = () => txv("depense", "d");
const CATS = {
  recette: [
    "Cotisations",
    "Dons",
    "Subventions",
    "Prestations de services",
    "Contributions exceptionnelles",
    "Autres recettes",
  ],
  depense: [
    "Fonctionnement",
    "Transport",
    "Communication",
    "Matériel informatique",
    "Événements",
    "Salaires et prestations",
    "Autres dépenses",
  ],
};
function addT(ty, id) {
  const x = S.tx.find((t) => t.id == id);
  form(
    (x ? "Modifier" : "Nouvelle") + (ty == "recette" ? " recette" : " dépense"),
    [
      { k: "cat", l: "Catégorie", o: CATS[ty] },
      { k: "amt", l: "Montant (F)", t: "number" },
      {
        k: "desc",
        l: ty == "recette" ? "Description" : "Motif / bénéficiaire",
      },
      { k: "date", l: "Date", t: "date" },
      {
        k: "mode",
        l: "Mode de paiement",
        o: ["Espèces", "Mobile Money", "Virement", "Chèque"],
      },
    ],
    x || { date: "2026-11-01" },
    (o) => {
      if (x) Object.assign(x, o);
      else S.tx.push({ id: "t" + ++S.n, type: ty, ...o });
      toast("Opération enregistrée");
    },
  );
}
function dt(id) {
  if (!confirm("Confirmer la suppression ?")) return;
  S.tx = S.tx.filter((x) => x.id != id);
  save();
  toast("Opération supprimée");
  go();
}
R.treso = () => {
  let b = 0;
  const j = [...S.tx]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => {
      b += x.type == "recette" ? x.amt : -x.amt;
      return { ...x, b };
    })
    .reverse()
    .slice(0, 12);
  return `<div class=top><h1>Trésorerie</h1><button class="b ${S.open ? "g" : ""}" onclick="S.open=!S.open;save();toast(S.open?'Caisse ouverte (simulation)':'Caisse clôturée (simulation)');go()">${S.open ? "Clôturer la caisse" : "Ouvrir la caisse"}</button></div><div class="g g3"><div class=card><span class=mu>Solde disponible</span><div class=big>${fm(b)}</div>${S.open ? bdg("actif").replace("actif", "Caisse ouverte") : bdg("suspendu").replace("suspendu", "Caisse clôturée")}</div><div class=card><span class=mu>Entrées</span><div class=big style="color:var(--ok)">${fm(sm(S.tx, "recette"))}</div></div><div class=card><span class=mu>Sorties</span><div class=big style="color:var(--ko)">${fm(sm(S.tx, "depense"))}</div></div></div><div class=card><h3>Journal de caisse</h3><div class=tw><table><tr><th>Date</th><th>Libellé</th><th>Entrée</th><th>Sortie</th><th>Solde</th></tr>${j.map((x) => `<tr><td>${x.date}</td><td>${x.cat}</td><td>${x.type == "recette" ? fm(x.amt) : ""}</td><td>${x.type == "depense" ? fm(x.amt) : ""}</td><td><b>${fm(x.b)}</b></td></tr>`).join("")}</table></div></div>`;
};
R.rapports = () => {
  const row = (ty) => {
    const m = {};
    S.tx
      .filter((x) => x.type == ty)
      .forEach((x) => (m[x.cat] = (m[x.cat] || 0) + x.amt));
    return Object.entries(m)
      .map(([k, v]) => `<tr><td>${k}</td><td><b>${fm(v)}</b></td></tr>`)
      .join("");
  };
  return `<div class=top><h1>Rapports</h1><div style="display:flex;gap:8px"><button class="b g" onclick="toast('Export PDF simulé')">PDF</button><button class="b g" onclick="toast('Export Excel/CSV simulé')">CSV</button><button class=b onclick="window.print()">Imprimer</button></div></div><div class="g g2" style="grid-template-columns:1fr 1fr"><div class=card><h3>Recettes par catégorie</h3><table>${row("recette")}</table></div><div class=card><h3>Dépenses par catégorie</h3><div style="height:200px"><canvas id=c3></canvas></div><table>${row("depense")}</table></div></div>`;
};
R.rapports.i = () => {
  const m = {};
  S.tx
    .filter((x) => x.type == "depense")
    .forEach((x) => (m[x.cat] = (m[x.cat] || 0) + x.amt));
  mk("#c3", {
    type: "doughnut",
    data: {
      labels: Object.keys(m),
      datasets: [
        {
          data: Object.values(m),
          backgroundColor: [
            "#fd7e14",
            "#0d6efd",
            "#198754",
            "#ffc107",
            "#0dcaf0",
            "#dc3545",
            "#7b8494",
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "right" } },
    },
  });
};
R.notifs = () => {
  const a = [
    ...alerts(),
    "✅ Dernier paiement enregistré avec succès.",
    "📉 Dépense de fonctionnement enregistrée ce mois.",
  ];
  return `<h1 style="margin-bottom:16px">Notifications</h1><div class=card>${a.map((x) => `<p style="border-bottom:1px solid var(--bd);padding-bottom:10px">${x}</p>`).join("")}</div>`;
};
go();
