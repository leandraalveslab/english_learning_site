"use strict";

const englishSpeech = (() => {
  let active = null;
  const engine = window.speechSynthesis;
  const supported = Boolean(engine && window.SpeechSynthesisUtterance);

  function stop() {
    active = null;
    engine?.cancel();
  }

  function play(text, status) {
    stop();
    status.textContent = "";
    if (!supported) {
      status.textContent = "A voz em inglês está indisponível neste navegador.";
      return;
    }
    const voiceList = engine.getVoices();
    const preferred = ["en-ca", "en-us"];
    const voice = preferred.map((lang) => voiceList.find((item) => item.lang.toLowerCase() === lang))
      .find(Boolean) ?? voiceList.find((item) => /^en\b/i.test(item.lang));
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang ?? "en-US";
    if (voice) utterance.voice = voice;
    utterance.rate = document.getElementById("speech-slow").checked ? 0.72 : 0.95;
    active = utterance;
    utterance.onend = () => {
      if (active === utterance) active = null;
    };
    utterance.onerror = () => {
      if (active !== utterance) return;
      active = null;
      status.textContent = "O áudio não tocou. Confira o volume de mídia e a voz em inglês do aparelho.";
    };
    engine.speak(utterance);
  }

  return {play, stop, supported};
})();

const pronunciationTips = new Map([
  ["borrow", ["Dê mais força à primeira sílaba. O final termina com um som de ‘ou’.", "Stress the first syllable. End with the vowel sound in go."]],
  ["quiet", ["Faça duas sílabas. A primeira rima com ‘why’ e é a mais forte.", "Use two syllables. Stress the first syllable, which rhymes with why."]],
  ["toward", ["Uma pronúncia comum tem duas sílabas. Diga a primeira bem leve e dê mais força à segunda.", "One common pronunciation has two syllables. Make the first syllable weak and stress the second."]],
  ["listen", ["O ‘t’ é mudo. A primeira sílaba é a mais forte.", "The t is silent. Stress the first syllable."]],
  ["choose", ["O início tem o som de ‘ch’ em ‘chair’. Termine com o som de ‘z’.", "Start with the ch sound in chair and end with a z sound."]],
  ["enough", ["O ‘gh’ no final tem som de ‘f’. Dê mais força à segunda sílaba.", "The gh sounds like f. Stress the second syllable."]],
  ["together", ["No ‘th’, encoste a língua de leve entre os dentes e faça a voz vibrar.", "Put your tongue lightly between your teeth and use your voice for the th sound."]],
  ["thirsty", ["Comece com a ponta da língua entre os dentes e solte ar no ‘th’.", "Put the tip of your tongue between your teeth and let air out for the th."]],
  ["seemed", ["Alongue o som de ‘i’ e termine com ‘d’ logo depois do ‘m’. A palavra tem uma sílaba.", "Use a long ee sound. End with m followed by d, all in one syllable."]],
  ["wanted", ["Termine com uma sílaba extra, com ‘d’ no final.", "Say a separate syllable at the end and finish with d."]],
  ["told", ["A vogal tem o som de ‘o’ de ‘go’. Feche a palavra com ‘l’ e ‘d’.", "Use the vowel sound in go and end with l followed by d."]],
  ["early", ["Dê mais força à primeira sílaba. Termine com o som de ‘i’ de ‘happy’.", "Stress the first syllable. End with the vowel sound at the end of happy."]],
  ["repeat", ["Dê mais força à segunda sílaba, que rima com ‘seat’.", "Stress the second syllable, which rhymes with seat."]],
  ["share", ["Comece com o som de ‘sh’ de ‘shoe’, parecido com o ‘ch’ de ‘chá’.", "Start with the sh sound in shoe."]],
  ["ready", ["Dê mais força à primeira sílaba. O ‘ea’ soa como o ‘e’ de ‘red’.", "Stress the first syllable. The ea has the same vowel sound as red."]],
  ["arrive", ["A segunda sílaba é a mais forte e rima com ‘five’.", "Stress the second syllable, which rhymes with five."]]
]);

(() => {
  const get = (id) => document.getElementById("exercise-" + id);
  const storageKey = "ingles-em-10:exercise-best:v1";
  const points = 10;
  const missionKey = "ingles-em-10:missions:v1";
  const missions = [
    {
      id: "coffee", title: "Pedir um café",
      questions: [
        {word: "That's all, thanks.", choices: ["É para viagem.", "É só isso, obrigada.", "Quero pagar em dinheiro."],
          answers: ["É só isso, obrigada."], explanation: "Use That's all, thanks para encerrar o pedido."},
        {phrase: "Could I ___ a medium coffee, please?", translation: "Eu gostaria de um café médio, por favor. (have / get)",
          answers: ["have", "get"], explanation: "Could I have…? e Could I get…? são formas educadas de pedir."},
        {word: "Would you like a receipt?", listening: true, choices: ["Você quer mais café?", "Você quer pagar com cartão?", "Você quer o recibo?"],
          answers: ["Você quer o recibo?"], explanation: "Receipt significa recibo. O p é mudo."}
      ]
    },
    {
      id: "bus", title: "Pegar o ônibus",
      questions: [
        {word: "Get off the bus.", choices: ["Descer do ônibus.", "Pegar o ônibus.", "Esperar o ônibus."],
          answers: ["Descer do ônibus."], explanation: "Get off é descer. Get on é embarcar."},
        {phrase: "___ this bus go downtown?", translation: "Este ônibus vai até o centro? (do / does)",
          answers: ["does"], explanation: "Use Does para começar essa pergunta com this bus."},
        {word: "The next stop is Main Street.", listening: true, choices: ["O ônibus está atrasado.", "A próxima parada é Main Street.", "A última parada foi Main Street."],
          answers: ["A próxima parada é Main Street."], explanation: "Next stop significa próxima parada."}
      ]
    },
    {
      id: "daycare", title: "Conversar na creche",
      questions: [
        {word: "Let's take turns.", choices: ["Vamos lavar as mãos.", "Vamos guardar os brinquedos.", "Vamos nos revezar."],
          answers: ["Vamos nos revezar."], explanation: "Use take turns para combinar a vez de cada criança."},
        {phrase: "Please ___ your hands.", translation: "Por favor, lave as mãos. (wash)",
          answers: ["wash"], explanation: "Please wash your hands é um pedido direto e gentil."},
        {word: "It's time to clean up.", listening: true, choices: ["É hora de arrumar tudo.", "É hora de comer.", "É hora de brincar lá fora."],
          answers: ["É hora de arrumar tudo."], explanation: "Clean up aqui é guardar os materiais e arrumar o espaço."}
      ]
    }
  ];
  const grammar = [
    ["She ___ at a daycare.", "Ela trabalha em uma creche. (work)", ["works"], "Com she, work vira works nesta frase."],
    ["They ___ the bus every morning.", "Eles pegam o ônibus todas as manhãs. (take)", ["take"], "Com they, usamos take na forma básica."],
    ["___ you live near here?", "Você mora perto daqui?", ["do"], "Use Do para começar uma pergunta de rotina com you."],
    ["___ she work on Mondays?", "Ela trabalha às segundas?", ["does"], "Use Does para começar uma pergunta de rotina com she."],
    ["I ___ ready to go.", "Estou pronta para ir.", ["am"], "Com I, a forma de to be no presente é am."],
    ["The keys ___ on the table.", "As chaves estão na mesa.", ["are"], "Keys está no plural, então usamos are."],
    ["My bag ___ under the chair.", "Minha bolsa está embaixo da cadeira.", ["is"], "My bag está no singular, então usamos is."],
    ["I ___ my keys yesterday.", "Eu esqueci minhas chaves ontem. (forget)", ["forgot"], "Forgot é o passado de forget."],
    ["Can you ___ that, please?", "Você pode repetir isso, por favor? (repeat)", ["repeat"], "Depois de can, repeat fica na forma básica."],
    ["___ is my coat?", "Onde está meu casaco?", ["where"], "Use where para perguntar onde algo está."],
    ["I have ___ appointment at nine.", "Tenho uma consulta às nove.", ["an"], "Appointment começa com som de vogal, então usamos an."],
    ["We ___ busy yesterday.", "Estávamos ocupados ontem.", ["were"], "Com we, a forma de to be no passado é were."],
    ["He ___ the bus at six.", "Ele pega o ônibus às seis. (take)", ["takes"], "Com he, acrescentamos -s a take."],
    ["She ___ like tea.", "Ela não gosta de chá. (do not)", ["does not", "doesn't"], "Use does not ou doesn't com she. Like fica na forma básica."],
    ["They ___ work on Sundays.", "Eles não trabalham aos domingos. (do not)", ["do not", "don't"], "Use do not ou don't com they."],
    ["___ do you get off the bus?", "Em que lugar você desce do ônibus?", ["where"], "Where pergunta pelo lugar."],
    ["___ time does the store open?", "A que horas a loja abre?", ["what"], "Use What time para perguntar a hora."],
    ["There ___ a book on the shelf.", "Há um livro na prateleira.", ["is"], "Use there is quando há uma coisa no singular."],
    ["There ___ two cups on the tray.", "Há dois copos na bandeja.", ["are"], "Use there are antes de um substantivo no plural."],
    ["My appointment is ___ Monday.", "Minha consulta é na segunda-feira.", ["on"], "Use on com dias da semana."],
    ["The class starts ___ nine.", "A aula começa às nove.", ["at"], "Use at para indicar um horário."],
    ["The kids are ___ outside.", "As crianças estão brincando lá fora. (play)", ["playing"], "Use are + verbo com -ing para uma ação que está acontecendo."],
    ["Please ___ your hands.", "Por favor, lave as mãos. (wash)", ["wash"], "Em um pedido direto, use a forma básica do verbo."],
    ["Could I ___ a medium coffee, please?", "Eu gostaria de um café médio, por favor. (have / get)", ["have", "get"], "Could I have ou Could I get são formas educadas de pedir."],
    ["We ___ to the park yesterday.", "Fomos ao parque ontem. (go)", ["went"], "Went é o passado de go."],
    ["I ___ at home yesterday.", "Eu estava em casa ontem. (to be)", ["was"], "No passado, use I was."],
    ["This is ___ coat.", "Este é o meu casaco.", ["my"], "Use my antes da coisa que pertence a você quando fala de si mesma."],
    ["___ are my keys here in my hand.", "Estas são as minhas chaves, aqui na minha mão. (this / these)", ["these"], "Use these para coisas no plural que estão perto."],
    ["My bag is ___ the chair.", "Minha bolsa está embaixo da cadeira.", ["under"], "Under indica que algo está embaixo."],
    ["I need ___ buy milk.", "Eu preciso comprar leite.", ["to"], "Use need to seguido do verbo na forma básica."]
  ];
  let day = "";
  let dailyEntries = [];
  let questions = [];
  let position = 0;
  let score = 0;
  let graded = false;
  let bestScores = {};
  let missionScores = {};
  let activeMission = null;

  function loadScores() {
    try {
      bestScores = JSON.parse(localStorage.getItem(storageKey)) ?? bestScores;
      missionScores = JSON.parse(localStorage.getItem(missionKey)) ?? missionScores;
    } catch {
      // Keep scores available for this visit if browser storage is unavailable.
    }
  }

  function updateBest() {
    get("best").textContent = "Melhor resultado do dia: " + (bestScores[day] || 0) + " de 60 pontos";
  }

  function storeBest() {
    loadScores();
    const scores = activeMission ? missionScores : bestScores;
    const key = activeMission ? activeMission.id : day;
    scores[key] = Math.max(score, scores[key] || 0);
    updateBest();
    try {
      localStorage.setItem(activeMission ? missionKey : storageKey, JSON.stringify(scores));
      return true;
    } catch {
      return false;
    }
  }

  function missionUnlocked(index) {
    if (index === 0) return Object.values(bestScores).some((value) => value >= 30);
    return (missionScores[missions[index - 1].id] || 0) >= 20;
  }

  function renderMissions() {
    const buttons = missions.map((mission, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mission-card";
      button.textContent = mission.title;
      const status = document.createElement("small");
      button.disabled = !missionUnlocked(index);
      const best = missionScores[mission.id] || 0;
      status.textContent = button.disabled ? "Bloqueada" : best >= 20
        ? "Concluída: " + best + " de 30 pontos" : "Disponível: " + best + " de 30 pontos";
      button.dataset.state = button.disabled ? "locked" : best >= 20 ? "done" : "open";
      button.append(status);
      button.addEventListener("click", () => {
        if (!missionUnlocked(index)) return;
        activeMission = mission;
        start();
      });
      return button;
    });
    get("mission-list").replaceChildren(...buttons);
  }

  function goHome() {
    englishSpeech.stop();
    activeMission = null;
    get("start").hidden = false;
    get("round").hidden = true;
    get("finish").hidden = true;
    get("missions").hidden = false;
    renderMissions();
  }

  function choiceQuestion(entry, position, listening = false) {
    const [word, meaning, example, translation] = entry;
    const choices = [...new Set(dailyEntries.map((item) => item[1]).filter((item) => item !== meaning))].slice(0, 3);
    choices.splice(position % (choices.length + 1), 0, meaning);
    return {word, choices, listening, answers: [meaning], explanation: example + " — " + translation};
  }

  function grammarQuestion(entry) {
    const [phrase, translation, answers, explanation] = entry;
    return {phrase, translation, answers, explanation};
  }

  function showQuestion() {
    englishSpeech.stop();
    const question = questions[position];
    graded = false;
    get("progress-bar").max = questions.length;
    get("progress-bar").value = position;
    get("progress").textContent = (activeMission ? activeMission.title + ": " : "") + "Pergunta " + (position + 1) + " de " + questions.length + ", " + score + " pontos";
    get("prompt").textContent = question.listening ? "O que você ouviu em inglês?"
      : question.choices ? "O que isso significa?" : "Complete a frase em inglês.";
    get("phrase").textContent = question.phrase || (question.listening ? "" : question.word);
    get("choices").hidden = !question.choices;
    get("listening").hidden = !question.listening;
    get("play").disabled = !englishSpeech.supported;
    get("text").hidden = false;
    get("fill").hidden = Boolean(question.choices);
    get("check").hidden = Boolean(question.choices);
    get("input").value = "";
    get("input").disabled = false;
    get("feedback").textContent = question.translation || "";
    get("next").hidden = true;
    const buttons = (question.choices ?? []).map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice;
      button.addEventListener("click", () => grade(choice, button));
      return button;
    });
    get("choices").replaceChildren(...buttons);
    get("prompt").focus();
  }

  function start() {
    if (!dailyEntries.length) return;
    const dayIndex = Math.floor(Date.parse(day + "T00:00:00Z") / 86400000);
    const grammarIndex = ((dayIndex * 2) % grammar.length + grammar.length) % grammar.length;
    questions = activeMission ? activeMission.questions : [
      choiceQuestion(dailyEntries[0], (dayIndex * 3 + 1) % 4),
      grammarQuestion(grammar[grammarIndex]),
      choiceQuestion(dailyEntries[1], (dayIndex * 7 + 3) % 4),
      choiceQuestion(dailyEntries[2], (dayIndex * 19 + 1) % 4, true),
      grammarQuestion(grammar[(grammarIndex + 1) % grammar.length]),
      choiceQuestion(dailyEntries[3], (Math.floor(dayIndex / 2) + 2) % 4)
    ];
    position = 0;
    score = 0;
    get("start").hidden = true;
    get("finish").hidden = true;
    get("round").hidden = false;
    get("missions").hidden = true;
    showQuestion();
  }

  function grade(response, selectedButton) {
    if (graded || !response.trim()) return;
    const question = questions[position];
    const normalize = (value) => value.trim().toLowerCase().replace(/[.!?]+$/, "").replace(/\s+/g, " ");
    const correct = question.answers.some((answer) => normalize(answer) === normalize(response));
    graded = true;
    if (correct) score += points;
    if (question.choices && question.word) {
      document.dispatchEvent(new CustomEvent("word-practice", {detail: {word: question.word, result: correct, source: "exercise"}}));
    }
    get("progress-bar").value = position + 1;
    get("input").disabled = true;
    get("check").hidden = true;
    for (const button of get("choices").children) {
      button.disabled = true;
      if (button.textContent === question.answers[0]) button.classList.add("correct");
    }
    if (!correct) selectedButton?.classList.add("incorrect");
    get("feedback").textContent = (correct ? "Acertou! +10 pontos." : "Resposta: " + question.answers[0] + ".")
      + (question.listening ? " Em inglês: “" + question.word + "”." : "") + "\n" + question.explanation;
    get("play").disabled = true;
    get("text").hidden = true;
    get("next").textContent = position === questions.length - 1 ? "Ver resultado" : "Próxima pergunta";
    get("next").hidden = false;
    get("next").focus();
  }

  get("begin").addEventListener("click", start);
  get("replay").addEventListener("click", start);
  get("home").addEventListener("click", () => {
    goHome();
    get("begin").focus();
  });
  get("form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!get("input").value.trim()) {
      get("input").focus();
      return;
    }
    grade(get("input").value);
  });
  get("play").addEventListener("click", () => {
    const question = questions[position];
    englishSpeech.play(question.word, get("feedback"));
  });
  get("text").addEventListener("click", () => {
    get("phrase").textContent = questions[position].word;
    get("text").hidden = true;
    get("phrase").setAttribute("tabindex", "-1");
    get("phrase").focus();
  });
  get("next").addEventListener("click", () => {
    if (++position < questions.length) {
      showQuestion();
      return;
    }
    englishSpeech.stop();
    get("round").hidden = true;
    get("finish").hidden = false;
    get("result").textContent = score + "/" + (questions.length * points) + " pontos";
    const availableBefore = missions.filter((_, index) => missionUnlocked(index)).length;
    const saved = storeBest();
    const availableAfter = missions.filter((_, index) => missionUnlocked(index)).length;
    if (!saved) {
      get("result-note").textContent = "A pontuação e os desbloqueios desta visita não puderam ser salvos.";
    } else if (availableAfter > availableBefore) {
      get("result-note").textContent = "Você desbloqueou: " + missions[availableBefore].title + ".";
    } else {
      get("result-note").textContent = "Seu melhor resultado foi guardado neste navegador.";
    }
    get("missions").hidden = false;
    renderMissions();
    get("result").focus();
  });

  document.addEventListener("study-vocabulary-change", ({detail}) => {
    day = detail.day;
    dailyEntries = detail.entries;
    loadScores();
    updateBest();
    goHome();
  });
})();
