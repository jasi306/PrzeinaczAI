const DEFAULT_PERSONAS = [
  {
    id: "robert",
    name: "Robert Makłowicz",
    system: "Mów jak Robert Makłowicz: z pasją, erudycją i nutą humoru kulinarnego.",
    styleHint: "Używaj bogatego języka, dodaj smakowite metafory i lekki ton podróżnika."
  },
  {
    id: "bomba",
    name: "Kapitan Bomba",
    system: "Mów jak Kapitan Bomba: dosadnie, absurdalnie, z przesadą i autoironią, ale bez wulgaryzmów.",
    styleHint: "Sarkazm, krótka forma, mocne pointy."
  },
  {
    id: "yoda",
    name: "Yoda",
    system: "Mów jak mistrz Yoda: odwracaj szyk zdań i dodawaj mądrości w prostych słowach.",
    styleHint: "Odwrócona składnia, spokojny ton, sentencjonalny rytm."
  }
];


const els = {
  auto: document.getElementById("autoMode"),
  endpoint: document.getElementById("endpoint"),
  list: document.getElementById("personasList"),
  id: document.getElementById("p_id"),
  name: document.getElementById("p_name"),
  system: document.getElementById("p_system"),
  hint: document.getElementById("p_hint"),
  msg: document.getElementById("msg"),
  save: document.getElementById("savePersona"),
  clear: document.getElementById("clearPersona"),
  reset: document.getElementById("resetDefaults"),
};

let personas = [];

init();

async function init() {
  const data = await chrome.storage.sync.get(["auto_mode", "endpoint", "personas", "persona_id"]);
  els.auto.checked = Boolean(data.auto_mode);
  els.endpoint.value = data.endpoint || "";

  personas = Array.isArray(data.personas) && data.personas.length ? data.personas : DEFAULT_PERSONAS.slice();
  renderList(data.persona_id);
}

function renderList(selectedId) {
  els.list.innerHTML = "";
  personas.forEach(p => {
    const row = document.createElement("div");
    row.className = "persona-item";
    const strong = document.createElement("strong");
    strong.textContent = `${p.name}  `;
    const small = document.createElement("span");
    small.className = "note";
    small.textContent = `(${p.id})`;

    const pickBtn = document.createElement("button");
    pickBtn.textContent = (selectedId === p.id) ? "Wybrana" : "Wybierz";
    pickBtn.addEventListener("click", async () => {
      await chrome.storage.sync.set({ persona_id: p.id });
      chrome.runtime.sendMessage({ type: "SET_PERSONA", id: p.id });
      renderList(p.id);
      flash("Ustawiono personę: " + p.name);
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edytuj";
    editBtn.addEventListener("click", () => {
      els.id.value = p.id;
      els.name.value = p.name;
      els.system.value = p.system || "";
      els.hint.value = p.styleHint || "";
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "Usuń";
    delBtn.addEventListener("click", async () => {
      personas = personas.filter(x => x.id !== p.id);
      await persist();
      renderList(selectedId === p.id ? null : selectedId);
      flash("Usunięto: " + p.name);
    });

    row.append(strong, small, pickBtn, editBtn, delBtn);
    els.list.appendChild(row);
  });
}

els.save.addEventListener("click", async () => {
  const obj = {
    id: els.id.value.trim(),
    name: els.name.value.trim(),
    system: els.system.value.trim(),
    styleHint: els.hint.value.trim()
  };
  if (!obj.id || !obj.name) return flash("ID i Nazwa są wymagane.");

  const exists = personas.findIndex(p => p.id === obj.id);
  if (exists >= 0) personas[exists] = obj; else personas.push(obj);
  await persist();
  renderList((await chrome.storage.sync.get("persona_id")).persona_id);
  clearForm();
  flash("Zapisano personę.");
});

els.clear.addEventListener("click", clearForm);
els.reset.addEventListener("click", async () => {
  personas = DEFAULT_PERSONAS.slice();
  await persist();
  renderList();
  flash("Przywrócono domyślne persony.");
});

els.auto.addEventListener("change", async () => {
  await chrome.storage.sync.set({ auto_mode: els.auto.checked });
  flash("Zapisano tryb auto: " + (els.auto.checked ? "ON" : "OFF"));
});

els.endpoint.addEventListener("change", async () => {
  await chrome.storage.sync.set({ endpoint: els.endpoint.value.trim() });
  flash("Zapisano endpoint.");
});

async function persist() {
  await chrome.storage.sync.set({ personas });
  chrome.runtime.sendMessage({ type: "SET_PERSONAS", items: personas });
}

function clearForm() {
  els.id.value = "";
  els.name.value = "";
  els.system.value = "";
  els.hint.value = "";
}

function flash(text) {
  els.msg.textContent = text;
  setTimeout(() => (els.msg.textContent = ""), 1500);
}
