// Fixed personas (bez ustawień użytkownika)
const PERSONAS = [
  { id: "geralt",        name: "Geralt z Rivii", img: "personas/geralt.png", desc: "Mów oszczędnie, rzeczowo i z lekką szorstkością, używaj suchych komentarzy i sarkazmu, mów jak ktoś, kto widział zbyt wiele i nie ma złudzeń. Wtrąć czasem \"zaraza\"." }, // id ujednolicone: "geralt"
  { id: "robert",          name: "Robert Makłowicz", img: "personas/robert.png", desc: "Dodawaj angedoty i ciekawostki historyczne, mów z pasją o jedzeniu i kulturze." }, // id ujednolicone: "robert"
  { id: "kapitan-bomba", name: "Kapitan Bomba",    img: "personas/bomba.png", desc: "Nie cenzuruj się, używaj wulgaryzmów i mów jak kapitan bomba z kreskówki." }
];

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const absurdInput = document.getElementById("absurd");
const absurdLabel = document.getElementById("absurdLabel");
const applyBtn = document.getElementById("apply");

let currentPersonaId = null; // <- pamiętamy wybór do zapisu

init();

async function init() {
  const { persona_id, absurd_level } = await chrome.storage.sync.get(["persona_id", "absurd_level"]);

  // render + ustaw aktualnie wybraną personę
  const initialPersona = persona_id || PERSONAS[0].id;
  render(initialPersona);
  currentPersonaId = initialPersona;

  // slider tylko aktualizuje etykietę (bez zapisu)
  const level = absurd_level ?? 3;
  absurdInput.value = level;
  updateAbsurdLabel(level);
  absurdInput.addEventListener("input", onAbsurdChange);

  // przycisk zapisuje i zamyka popup
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
  grid.innerHTML = "";
  PERSONAS.forEach(p => {
    const card = document.createElement("button");
    card.className = "card" + (p.id === selectedId ? " active" : "");
    card.dataset.id = p.id;

    const img = document.createElement("img");
    img.src = p.img; img.alt = p.name;

    const name = document.createElement("div");
    name.className = "name"; name.textContent = p.name;

    card.append(img, name);
    card.addEventListener("click", () => selectPersona(p.id));
    grid.appendChild(card);
  });
}

function selectPersona(id) {
  currentPersonaId = id;            // <- ustawiamy bieżący wybór
  render(id);                       // odśwież zaznaczenie
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

  window.close(); // zamknij popup po zapisaniu
}

function flash(t) { statusEl.textContent = t; setTimeout(() => statusEl.textContent="", 1000); }
