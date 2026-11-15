"use strict";

// Caderno de palavras: registra quando cada palavra foi vista e se a resposta foi certa ou errada.
// Os dados ficam em localStorage, em um formato simples para outras ferramentas lerem depois.
(() => {
  const storageKey = "ingles-em-10:word-log:v1";
  const historyLimit = 30;
  const shortDate = new Intl.DateTimeFormat("pt-BR", {day: "2-digit", month: "2-digit"});
  const entries = new Map(studyWords.map((entry) => [entry[0], entry]));
  const sources = {flashcard: "flashcard", exercise: "treino rápido"};
  const tabs = [
    ["review", "Para rever"],
    ["right", "Acertei"],
    ["seen", "Só vi"],
    ["new", "Não vi"]
  ];
  let log = {version: 1, words: {}};
  let tab = null;
  let picked = false;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved?.words) log = saved;
  } catch {
    // Sem armazenamento, o registro vale só nesta visita.
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(log));
    } catch {
      // O caderno continua funcionando nesta visita.
    }
  }

  function today() {
    const now = new Date();
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  }

  function label(key) {
    const [year, month, day] = key.split("-").map(Number);
    return shortDate.format(new Date(year, month - 1, day));
  }

  function record(word, result, source) {
    if (!entries.has(word)) return;
    const date = today();
    const item = log.words[word] ??= {firstSeen: date, lastSeen: date, right: 0, wrong: 0, last: null, history: []};
    item.lastSeen = date;
    if (result === null) {
      if (!item.history.some((entry) => entry.date === date)) {
        item.history.push({date, result: "seen", source});
      }
    } else {
      item[result ? "right" : "wrong"] += 1;
      item.last = result ? "right" : "wrong";
      item.history.push({date, result: item.last, source});
    }
    item.history = item.history.slice(-historyLimit);
    save();
    render();
  }

  function statusOf(word) {
    const item = log.words[word];
    if (!item) return "new";
    return item.last === "wrong" ? "review" : item.last === "right" ? "right" : "seen";
  }

  function details(word) {
    const item = log.words[word];
    if (!item) return "Ainda não apareceu nos seus cartões.";
    const parts = ["Vista pela primeira vez em " + label(item.firstSeen)];
    if (item.lastSeen !== item.firstSeen) parts.push("última vez em " + label(item.lastSeen));
    if (item.right || item.wrong) {
      parts.push(item.right + (item.right === 1 ? " acerto" : " acertos") + " e " + item.wrong + (item.wrong === 1 ? " erro" : " erros"));
    }
    return parts.join(" · ") + ".";
  }

  function historyText(entry) {
    const what = entry.result === "right" ? "acertou" : entry.result === "wrong" ? "errou" : "viu";
    return label(entry.date) + " · " + what + " no " + (sources[entry.source] ?? entry.source);
  }

  function row(word) {
    const [, meaning, example, translation] = entries.get(word);
    const item = log.words[word];
    const box = document.createElement("details");
    box.className = "word-row";
    box.dataset.status = statusOf(word);
    const summary = document.createElement("summary");
    const title = document.createElement("strong");
    title.lang = "en";
    title.textContent = word;
    const when = document.createElement("small");
    when.textContent = item ? label(item.lastSeen) : "";
    summary.append(title, " · " + meaning, when);
    const info = document.createElement("p");
    info.textContent = details(word);
    const sample = document.createElement("p");
    sample.lang = "en";
    sample.className = "word-example";
    sample.textContent = example;
    const translated = document.createElement("p");
    translated.textContent = translation;
    box.append(summary, info, sample, translated);
    if (item?.history.length) {
      const list = document.createElement("ul");
      list.className = "word-history";
      for (const entry of [...item.history].reverse().slice(0, 6)) {
        const line = document.createElement("li");
        line.textContent = historyText(entry);
        list.append(line);
      }
      box.append(list);
    }
    return box;
  }

  function render() {
    const panel = document.getElementById("words-list");
    if (!panel) return;
    const groups = Object.fromEntries(tabs.map(([key]) => [key, []]));
    for (const word of entries.keys()) groups[statusOf(word)].push(word);
    const recent = (a, b) => (log.words[b]?.lastSeen ?? "").localeCompare(log.words[a]?.lastSeen ?? "");
    for (const key of ["review", "right", "seen"]) groups[key].sort(recent);
    if (!picked) tab = groups.review.length ? "review" : "right";

    const seen = entries.size - groups.new.length;
    document.getElementById("words-summary").textContent = seen
      ? "Você já viu " + seen + " de " + entries.size + " palavras: " + groups.right.length + " certas e " + groups.review.length + " para rever."
      : "As palavras aparecem aqui quando você pratica os cartões ou o treino rápido.";
    for (const [key, name] of tabs) {
      const button = document.getElementById("words-tab-" + key);
      button.textContent = name + " (" + groups[key].length + ")";
      button.setAttribute("aria-pressed", String(key === tab));
    }
    const words = groups[tab];
    const empty = {
      review: "Nenhuma palavra para rever. Quando errar ou marcar Rever amanhã, ela aparece aqui.",
      right: "Quando acertar uma palavra, ela aparece aqui.",
      seen: "Palavras que você viu, mas ainda não respondeu.",
      new: "Você já viu todas as palavras!"
    }[tab];
    const list = document.getElementById("words-list");
    if (!words.length) {
      const note = document.createElement("p");
      note.className = "words-empty";
      note.textContent = empty;
      list.replaceChildren(note);
    } else {
      list.replaceChildren(...words.map(row));
    }
  }

  document.addEventListener("word-practice", ({detail}) => record(detail.word, detail.result, detail.source));
  document.addEventListener("DOMContentLoaded", () => {
    for (const [key] of tabs) {
      document.getElementById("words-tab-" + key).addEventListener("click", () => {
        tab = key;
        picked = true;
        render();
      });
    }
    render();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) return;
    try {
      log = JSON.parse(event.newValue || "null") ?? {version: 1, words: {}};
    } catch {
      return;
    }
    render();
  });
})();
