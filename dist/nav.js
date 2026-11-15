"use strict";

// Navegação por telas: cada item do menu mostra uma tela e o botão voltar do aparelho funciona.
(() => {
  const screens = {
    inicio: {title: null, heading: "hero-title"},
    treino: {title: "Treino do dia", heading: "week-title"},
    vocabulario: {title: "Vocabulário", heading: "vocab-title"},
    exercicios: {title: "Treino rápido", heading: "exercise-title"},
    caderno: {title: "Meu caderno", heading: "notebook-title"}
  };
  const roots = new Set(["", "inicio", "treino", "planejador", "vocabulario", "exercicios", "caderno"]);
  const baseTitle = document.title;
  const parts = [...document.querySelectorAll("[data-screen]")];
  const links = [...document.querySelectorAll("[data-nav]")];
  let current = null;

  document.documentElement.classList.add("paged");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function targetFor(hash) {
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    const element = id ? document.getElementById(id) : null;
    const screen = id === "" ? "inicio" : element?.closest("[data-screen]")?.dataset.screen;
    return {id, element, screen};
  }

  function show(screen) {
    for (const part of parts) part.hidden = part.dataset.screen !== screen;
    for (const link of links) {
      if (link.dataset.nav === screen) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    const info = screens[screen];
    document.title = info.title ? info.title + " · Inglês em 10" : baseTitle;
    window.speechSynthesis?.cancel();
    current = screen;
  }

  function route(moveFocus) {
    const {id, element, screen} = targetFor(location.hash);
    if (!screen) {
      if (!current) show("inicio");
      if (element) element.focus?.({preventScroll: false});
      return;
    }
    const changed = screen !== current;
    if (changed) show(screen);
    if (roots.has(id)) {
      window.scrollTo(0, 0);
      if (moveFocus && changed) {
        const heading = document.getElementById(screens[screen].heading);
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({preventScroll: true});
        }
      }
    } else {
      element.scrollIntoView();
    }
  }

  window.addEventListener("hashchange", () => route(true));
  // Tocar no link da tela em que você já está leva de volta ao topo dela.
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.getAttribute("href") === location.hash) {
      event.preventDefault();
      route(false);
    }
  });
  route(false);
})();
