// 6 postaci w jednej grupie
const PERSONAS = [
  { id: "robert",        name: "Robert Makłowicz",  img: "personas/robert.png"     },
  { id: "yoda",          name: "Yoda",              img: "personas/yoda.png"       },
  { id: "kapitan-bomba", name: "Kapitan Bomba",     img: "personas/bomba.png"      },
  { id: "ferdynant",     name: "Ferdynand Kiepski", img: "personas/ferdynant.png"  },
  { id: "bugs",          name: "Królik Bugs",       img: "personas/bugs.png"       },
  { id: "geralt",        name: "Geralt z Rivii",    img: "personas/geralt.png"     }
];

const grid        = document.getElementById("grid");
const statusEl    = document.getElementById("status");
const absurdInput = document.getElementById("absurd");
const absurdLabel = document.getElementById("absurdLabel");
const applyBtn    = document.getElementById("apply");

let currentPersonaId = null;

init();

async function init() {
  const { persona_id, absurd_level } = await chrome.storage.sync.get(["persona_id", "absurd_level"]);

  // wybór startowy
  const initialPersona = persona_id || PERSONAS[0].id;
  currentPersonaId = initialPersona;

  render(initialPersona);

  // slider (UI)
  const level = absurd_level ?? 3;
  absurdInput.value = level;
  updateAbsurdLabel(level);
  absurdInput.addEventListener("input", onAbsurdChange);

  // zapis
  applyBtn?.addEventListener("click", onApply);
}

function onAbsurdChange() {
  updateAbsurdLabel(Number(absurdInput.value));
}

function updateAbsurdLabel(val) {
  const labels = {
    1: "Prawie serio",
    2: "Mniej serio",
    3: "Jak bum-cyk-cyk",
    4: "Grubo",
    5: "Absurdalnie"
  };
  absurdLabel.textContent = `${labels[val] ?? "Jak bum-cyk-cyk"} (${val})`;
}

function render(selectedId) {
  if (!grid) {
    console.warn("Brak #grid w DOM.");
    return;
  }

  grid.innerHTML = "";

  PERSONAS.forEach(p => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card" + (p.id === selectedId ? " active" : "");
    card.dataset.id = p.id;

    const img = document.createElement("img");
    img.src = p.img;
    img.alt = p.name;
    img.addEventListener("error", () => { img.style.background = "#f3f4f6"; img.removeAttribute("src"); });

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = p.name;

    card.append(img, name);
    card.addEventListener("click", () => selectPersona(p.id));
    grid.appendChild(card);
  });
}

function selectPersona(id) {
  currentPersonaId = id;
  document.querySelectorAll(".card").forEach(el => {
    el.classList.toggle("active", el.dataset.id === id);
  });
}

async function onApply() {
  if (!currentPersonaId) {
    alert("Wybierz postać przed zastosowaniem!");
    return;
  }
  const level = Number(absurdInput.value);

  await chrome.storage.sync.set({
    persona_id: currentPersonaId,
    absurd_level: level
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.tabs.sendMessage(tab.id, {
    type: "RUN_EXTRACTION",
    persona: (PERSONAS.find(p => p.id === currentPersonaId) || {}).name,
    absurd_level: level,
    desc: (PERSONAS.find(p => p.id === currentPersonaId) || {}).desc
  });

  window.close();
}

// (opcjonalny mini-toast)
function flash(t) {
  if (!statusEl) return;
  statusEl.textContent = t;
  setTimeout(() => (statusEl.textContent = ""), 1000);
}
