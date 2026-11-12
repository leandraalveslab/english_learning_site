"use strict";

(() => {
  const byId = (name) => document.getElementById("vocab-" + name);
  const storageKey = "ingles-em-10:vocabulary:v1";
  const dailyCount = 5;
  const reviewIntervals = [2, 4, 7, 14, 30];
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {weekday: "long", day: "numeric", month: "long"});
  const reviewDate = new Intl.DateTimeFormat("pt-BR", {day: "numeric", month: "long"});
  const words = new Map(studyWords.map((entry) => [entry[0], entry]));
  const order = [...words.keys()];
  let seed = 87231;
  for (let index = order.length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const other = seed % (index + 1);
    [order[index], order[other]] = [order[other], order[index]];
  }

  let state = {days: {}, reviews: {}};
  let mode = "daily";
  let selectedDayLabel = "";
  let dayWords = [];
  let queue = [];
  let index = 0;
  let revealed = false;
  let finished = false;
  let storageBlocked = false;

  function readState() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) state = JSON.parse(saved);
    } catch {
      storageBlocked = true;
    }
    return state;
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
      storageBlocked = false;
    } catch {
      storageBlocked = true;
    }
  }

  function localKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function dateFromKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function getDailyWords(key) {
    const days = readState().days;
    const saved = days[key];
    if (saved?.length === dailyCount && saved.every((word) => words.has(word))) return saved;

    const dayNumber = Date.parse(key + "T00:00:00Z") / 86400000;
    const offset = (dayNumber * dailyCount % order.length + order.length) % order.length;
    const selected = Array.from({length: dailyCount}, (_, position) => order[(offset + position) % order.length]);
    days[key] = selected;
    saveState();
    return selected;
  }

  function dueWords() {
    const today = localKey(new Date());
    return Object.entries(readState().reviews)
      .filter(([word, review]) => words.has(word) && review.due <= today)
      .sort(([, first], [, second]) => first.due.localeCompare(second.due))
      .map(([word]) => word);
  }

  function makeList() {
    const items = dayWords.map((key) => {
      const [word, meaning, example, translation] = words.get(key);
      const row = document.createElement("li");
      const title = document.createElement("strong");
      title.lang = "en";
      title.textContent = word;
      const sample = document.createElement("p");
      sample.lang = "en";
      sample.textContent = example;
      const translated = document.createElement("p");
      translated.textContent = translation;
      row.append(title, " · " + meaning, sample, translated);
      return row;
    });
    byId("words").replaceChildren(...items);
  }

  function render() {
    const due = dueWords().length;
    byId("date").textContent = mode === "daily" ? selectedDayLabel : "Revisão de hoje";
    byId("due").textContent = due ? "(" + due + ")" : "";
    byId("daily").setAttribute("aria-pressed", String(mode === "daily"));
    byId("review").setAttribute("aria-pressed", String(mode === "review"));
    byId("list").hidden = mode === "review";
    const active = queue.length > 0 && !finished;
    byId("practice").hidden = !active;
    byId("empty").hidden = active;
    if (!active) {
      byId("empty-title").textContent = finished ? "Treino concluído" : "Revisão em dia";
      byId("empty-text").textContent = finished
        ? "Toque em Palavras do dia ou Revisar para continuar."
        : "Pratique os cartões do dia e marque as respostas para trazer essas palavras de volta.";
      return;
    }

    const [word, meaning, example, translation] = words.get(queue[index]);
    byId("position").textContent = "Cartão " + (index + 1) + " de " + queue.length;
    byId("word").textContent = word;
    byId("meaning").textContent = meaning;
    byId("example").textContent = example;
    byId("translation").textContent = translation;
    byId("answer").hidden = !revealed;
    byId("ratings").hidden = !revealed;
    byId("reveal").hidden = revealed;
    byId("reveal").setAttribute("aria-expanded", String(revealed));
    byId("prev").disabled = index === 0;
    byId("next").disabled = index === queue.length - 1;
  }

  function setMode(nextMode) {
    mode = nextMode;
    queue = mode === "daily" ? dayWords : dueWords();
    index = 0;
    revealed = false;
    finished = false;
    byId("feedback").textContent = "";
    render();
  }

  function moveCard(amount) {
    index += amount;
    revealed = false;
    byId("feedback").textContent = "";
    render();
    byId("reveal").focus();
  }

  function rateCard(known) {
    const word = queue[index];
    const reviews = readState().reviews;
    const now = new Date();
    const today = localKey(now);
    const previous = reviews[word];
    const baseStage = (previous?.reviewedOn === today ? previous.baseStage : previous?.stage) ?? 0;
    const stage = known ? Math.min(baseStage + 1, reviewIntervals.length) : 0;
    now.setDate(now.getDate() + (known ? reviewIntervals[stage - 1] : 1));
    reviews[word] = {stage, baseStage, reviewedOn: today, due: localKey(now)};
    saveState();

    if (index + 1 === queue.length) finished = true;
    else index++;
    revealed = false;
    render();
    byId("feedback").textContent = storageBlocked
      ? "Este navegador bloqueou o salvamento da revisão."
      : word + " · Próxima revisão " + (known ? "em " + reviewDate.format(now) : "amanhã") + ".";
    byId(finished ? "empty-title" : "reveal").focus();
  }

  document.addEventListener("study-date-change", ({detail: key}) => {
    dayWords = getDailyWords(key);
    selectedDayLabel = dateLabel.format(dateFromKey(key));
    byId("list").open = false;
    makeList();
    setMode("daily");
  });
  byId("daily").addEventListener("click", () => setMode("daily"));
  byId("review").addEventListener("click", () => setMode("review"));
  byId("reveal").addEventListener("click", () => {
    revealed = true;
    render();
    byId("again").focus();
  });
  byId("prev").addEventListener("click", () => moveCard(-1));
  byId("next").addEventListener("click", () => moveCard(1));
  byId("again").addEventListener("click", () => rateCard(false));
  byId("know").addEventListener("click", () => rateCard(true));
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) render();
  });
})();
