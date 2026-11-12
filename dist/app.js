"use strict";

const $ = (id) => document.getElementById(id);
const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const classDays = new Set([1, 2, 4]);
const fullDay = new Intl.DateTimeFormat("pt-BR", {weekday: "long", day: "numeric", month: "long"});
const shortDate = new Intl.DateTimeFormat("pt-BR", {day: "2-digit", month: "2-digit"});
const storagePrefix = "ingles-em-10:v1:";
const cache = new Map();
const listeningSteps = [
  ["Ouvir sem legenda", "Escute o trecho e tente entender a ideia principal."],
  ["Conferir a transcrição", "Leia a transcrição ou a legenda em inglês e confira o que entendeu."],
  ["Ouvir novamente sem legenda", "Volte ao mesmo trecho e perceba o que ficou mais claro."]
];
const grammarPrompts = {
  0: "Escreva uma frase com there is ou there are.",
  1: "Se quiser revisar, escreva uma frase da aula.",
  2: "Se quiser revisar, transforme uma frase da aula em pergunta.",
  3: "Escreva uma pergunta de rotina com do ou does.",
  4: "Se quiser revisar, escreva uma frase da aula com I ou she.",
  5: "Escreva duas frases de rotina com I e she.",
  6: "Descreva um objeto com this ou that."
};

function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function monday(date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

function weekDates(start) {
  return dayNames.map((_, index) => addDays(start, index));
}

function newTimer(duration) {
  return {duration, remaining: duration * 60000, deadline: null, finished: false};
}

function readDay(date) {
  const key = dateKey(date);
  if (cache.has(key)) return cache.get(key);
  let saved = null;
  try {
    const raw = localStorage.getItem(storagePrefix + key);
    if (raw) saved = JSON.parse(raw);
  } catch {
    storageUnavailable();
  }
  const day = saved ?? {
    mode: "normal", steps: [false, false, false], media: "", minutes: 0,
    unknown: "", phrases: "", shadow: false, grammar: false,
    timers: {listening: newTimer(10), minimum: newTimer(5), shadowing: newTimer(classDays.has(date.getDay()) ? 2 : 4)}
  };
  cache.set(key, day);
  return day;
}

function storageUnavailable() {
  $("save-label").textContent = "O navegador bloqueou o salvamento";
}

function saveDay(date, day) {
  try {
    localStorage.setItem(storagePrefix + dateKey(date), JSON.stringify(day));
  } catch {
    storageUnavailable();
  }
}

let selected = new Date();
let week = monday(selected);

function currentDay() {
  return readDay(selected);
}

function practiced(day) {
  return day.minutes > 0 || day.steps.every(Boolean) || day.shadow || day.grammar || day.timers.shadowing.finished;
}

function updateWeek() {
  const dates = weekDates(week);
  const records = dates.map(readDay);
  const count = records.filter(practiced).length;
  const minutes = records.reduce((total, record) => total + record.minutes, 0);
  const goalCount = records.filter((record) => record.minutes >= 10).length;
  $("week-done").textContent = count + "/7 dias com treino";
  $("week-minutes").textContent = minutes + " min de listening";
  $("week-goal").textContent = goalCount + "/7 dias com 10 min";
  $("week-bar").value = count;
  Array.from($("week-days").children).forEach((button, index) => {
    const date = dates[index];
    const done = practiced(records[index]);
    button.setAttribute("aria-pressed", String(dateKey(date) === dateKey(selected)));
    if (dateKey(date) === dateKey(new Date())) button.setAttribute("aria-current", "date");
    else button.removeAttribute("aria-current");
    button.setAttribute("aria-label", fullDay.format(date) + (classDays.has(date.getDay()) ? ", aula" : ", prática") + (done ? ", treino registrado" : ""));
    button.querySelector(".day-dot").hidden = !done;
  });
}

function renderWeek() {
  $("week-range").textContent = shortDate.format(week) + " – " + shortDate.format(addDays(week, 6));
  $("week-days").innerHTML = weekDates(week).map((date, index) =>
    '<button class="day" type="button" data-index="' + index + '"><span class="day-name">' + dayNames[index] +
    '</span><span class="day-number">' + date.getDate() + '</span><span class="day-kind">' +
    (classDays.has(date.getDay()) ? "Aula" : "Prática") + '</span><span class="day-dot" aria-hidden="true">●</span></button>'
  ).join("");
  updateWeek();
}

function finishTimers(date, now) {
  const day = readDay(date);
  let changed = false;
  for (const [name, timer] of Object.entries(day.timers)) {
    if (timer.deadline === null || timer.deadline > now) continue;
    timer.deadline = null;
    timer.remaining = 0;
    timer.finished = true;
    if (name !== "shadowing") day.minutes += timer.duration;
    changed = true;
  }
  if (changed) saveDay(date, day);
  return changed;
}

function displayedTimer(kind, day) {
  return kind === "listening" && day.mode === "minimum" ? day.timers.minimum : day.timers[kind];
}

function remainingTime(timer, now = Date.now()) {
  return timer.deadline === null ? timer.remaining : Math.max(0, timer.deadline - now);
}

function clockText(milliseconds) {
  const seconds = Math.ceil(milliseconds / 1000);
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}

function updateTimers() {
  const day = currentDay();
  for (const kind of ["listening", "shadowing"]) {
    const timer = displayedTimer(kind, day);
    const running = timer.deadline !== null;
    const remaining = remainingTime(timer);
    const clock = $(kind + "-clock");
    const time = clockText(remaining);
    if (clock.textContent !== time) clock.textContent = time;
    const start = $(kind + "-start");
    const action = running ? "Pausar" : timer.finished ? "Iniciar de novo" : remaining < timer.duration * 60000 ? "Retomar" : "Iniciar";
    if (start.getAttribute("aria-label") !== action + " " + kind) {
      start.textContent = action;
      start.setAttribute("aria-label", action + " " + kind);
    }
    const duration = $(kind + "-duration");
    if (document.activeElement !== duration) duration.value = timer.duration;
    duration.disabled = running || (kind === "listening" && day.mode === "minimum");
    const status = $(kind + "-status");
    const text = timer.finished ? "Tempo concluído" : running ? "Em andamento" : remaining < timer.duration * 60000 ? "Pausado" : "";
    if (status.textContent !== text) status.textContent = text;
  }
}

function updateDay() {
  const day = currentDay();
  const description = fullDay.format(selected);
  const isToday = dateKey(selected) === dateKey(new Date());
  const inClass = classDays.has(selected.getDay());
  const minimum = day.mode === "minimum";
  $("day-title").textContent = description.charAt(0).toUpperCase() + description.slice(1);
  $("day-type").textContent = (isToday ? "HOJE · " : "") + (inClass ? "DIA DE AULA" : "PRÁTICA EM CASA");
  $("day-description").textContent = minimum
    ? "Reserve 5 minutos para as três etapas com um trecho bem curto. Shadowing e gramática ficam opcionais."
    : inClass
      ? "Aula de inglês e um treino de listening. Shadowing e gramática são opcionais."
      : "Comece pelo listening e pratique uma frase de shadowing e outra de gramática.";
  $("notes-day").textContent = description;
  $("normal-mode").setAttribute("aria-pressed", String(!minimum));
  $("short-mode").setAttribute("aria-pressed", String(minimum));
  $("extras-hint").textContent = minimum || inClass ? "Se tiver energia, escolha uma prática extra." : "Uma frase por vez já serve para praticar.";
  $("grammar-prompt").textContent = grammarPrompts[selected.getDay()];
  for (const field of ["media", "unknown", "phrases"]) $(field).value = day[field];
  $("minutes-listened").value = day.minutes;
  $("shadow-check").checked = day.shadow;
  $("grammar-check").checked = day.grammar;
  day.steps.forEach((checked, index) => { $("step-" + index).checked = checked; });
  updateTimers();
}

function selectDate(date) {
  selected = date;
  const nextWeek = monday(date);
  weekDates(nextWeek).forEach((item) => finishTimers(item, Date.now()));
  if (dateKey(nextWeek) !== dateKey(week) || !$("week-days").children.length) {
    week = nextWeek;
    renderWeek();
  } else {
    updateWeek();
  }
  updateDay();
}

function setMode(mode) {
  const day = currentDay();
  if (day.mode === mode) return;
  finishTimers(selected, Date.now());
  const timer = displayedTimer("listening", day);
  if (timer.deadline !== null) {
    timer.remaining = remainingTime(timer);
    timer.deadline = null;
  }
  day.mode = mode;
  saveDay(selected, day);
  updateDay();
}

function useTimer(kind, action, value) {
  const day = currentDay();
  finishTimers(selected, Date.now());
  const timer = displayedTimer(kind, day);
  if (action === "reset") Object.assign(timer, newTimer(timer.duration));
  if (action === "duration") Object.assign(timer, newTimer(value));
  if (action === "toggle") {
    if (timer.deadline !== null) {
      timer.remaining = remainingTime(timer);
      timer.deadline = null;
    } else {
      if (timer.finished) Object.assign(timer, newTimer(timer.duration));
      timer.deadline = Date.now() + timer.remaining;
    }
  }
  saveDay(selected, day);
  updateTimers();
  if (document.activeElement !== $("minutes-listened")) $("minutes-listened").value = day.minutes;
  updateWeek();
}

function saveField(field, value) {
  const day = currentDay();
  day[field] = value;
  saveDay(selected, day);
}

$("steps").innerHTML = listeningSteps.map(([name, description], index) =>
  '<label class="check-row"><input type="checkbox" id="step-' + index +
  '"><span><strong>' + (index + 1) + '. ' + name + '</strong><small>' + description + '</small></span></label>'
).join("");

$("timers").innerHTML = [["listening", "Listening"], ["shadowing", "Shadowing"]].map(([kind, name]) =>
  '<section class="timer" aria-label="' + name + '"><div class="timer-main"><span class="timer-name">' + name +
  '</span><label class="timer-duration"><span>Minutos</span><input id="' + kind +
  '-duration" aria-label="Minutos de ' + kind + '" type="number" min="1" max="60" step="1" inputmode="numeric"></label>' +
  '<span class="clock" role="timer" aria-label="Tempo restante de ' + kind + '" id="' + kind + '-clock"></span></div>' +
  '<div class="timer-controls"><button type="button" class="start" id="' + kind + '-start">Iniciar</button>' +
  '<button type="button" id="' + kind + '-reset" aria-label="Zerar cronômetro de ' + kind + '">Zerar</button>' +
  '<span class="timer-status" role="status" id="' + kind + '-status"></span></div></section>'
).join("");

$("week-days").addEventListener("click", (event) => {
  const button = event.target.closest("[data-index]");
  if (button) selectDate(addDays(week, Number(button.dataset.index)));
});
$("prev-week").addEventListener("click", () => selectDate(addDays(selected, -7)));
$("next-week").addEventListener("click", () => selectDate(addDays(selected, 7)));
$("go-today").addEventListener("click", () => selectDate(new Date()));
$("normal-mode").addEventListener("click", () => setMode("normal"));
$("short-mode").addEventListener("click", () => setMode("minimum"));
$("use-series").addEventListener("click", () => {
  const existing = currentDay().media.trim();
  if (!existing) {
    const prior = Array.from({length: 30}, (_, index) => readDay(addDays(selected, -index - 1)).media)
      .find((entry) => /^extra english/i.test(entry));
    saveField("media", prior || "Extra English · episódio 1");
    $("media").value = currentDay().media;
  }
  $("media").focus();
  $("media").setSelectionRange($("media").value.length, $("media").value.length);
});

listeningSteps.forEach((_, index) => {
  $("step-" + index).addEventListener("change", (event) => {
    const day = currentDay();
    day.steps[index] = event.target.checked;
    saveDay(selected, day);
    updateWeek();
  });
});

for (const field of ["media", "unknown", "phrases"]) {
  $(field).addEventListener("input", (event) => saveField(field, event.target.value));
}

for (const [id, field] of [["shadow-check", "shadow"], ["grammar-check", "grammar"]]) {
  $(id).addEventListener("change", (event) => {
    saveField(field, event.target.checked);
    updateWeek();
  });
}

$("minutes-listened").addEventListener("input", (event) => {
  const value = event.target.valueAsNumber;
  const minutes = Number.isFinite(value) ? Math.min(1440, Math.max(0, Math.round(value))) : 0;
  saveField("minutes", minutes);
  updateWeek();
});
$("minutes-listened").addEventListener("blur", () => {
  $("minutes-listened").value = currentDay().minutes;
});

for (const kind of ["listening", "shadowing"]) {
  const input = $(kind + "-duration");
  $(kind + "-start").addEventListener("click", () => useTimer(kind, "toggle"));
  $(kind + "-reset").addEventListener("click", () => useTimer(kind, "reset"));
  input.addEventListener("input", () => {
    const value = input.valueAsNumber;
    const timer = displayedTimer(kind, currentDay());
    if (input.validity.valid && Number.isFinite(value) && value !== timer.duration) {
      useTimer(kind, "duration", value);
    }
  });
  input.addEventListener("blur", () => {
    input.value = displayedTimer(kind, currentDay()).duration;
  });
}

function refreshTimers() {
  const now = Date.now();
  const dates = weekDates(week);
  for (const key of cache.keys()) {
    const [year, month, day] = key.split("-").map(Number);
    if (!dates.some((date) => dateKey(date) === key)) dates.push(new Date(year, month - 1, day));
  }
  let changed = false;
  for (const date of dates) if (finishTimers(date, now)) changed = true;
  if (changed) {
    if (document.activeElement !== $("minutes-listened")) $("minutes-listened").value = currentDay().minutes;
    updateWeek();
  }
  updateTimers();
}

selectDate(selected);
setInterval(refreshTimers, 250);
document.addEventListener("visibilitychange", refreshTimers);
