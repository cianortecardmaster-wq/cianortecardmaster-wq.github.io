(() => {
  "use strict";

  const MESA42_FEED = "https://mesa42.cianortecardmasters.com.br/data/latest.js";
  const ZINE_FEED = "https://revista.cianortecardmasters.com.br/data/latest.js";

  function safeUrl(value, fallback) {
    try {
      const url = new URL(String(value || fallback), fallback);
      return /^https?:$/.test(url.protocol) ? url.href : fallback;
    } catch {
      return fallback;
    }
  }

  function textValue(...values) {
    const value = values.find((item) => item !== undefined && item !== null && String(item).trim() !== "");
    return value === undefined ? "" : String(value).trim();
  }

  function loadFeed(url, onError) {
    const script = document.createElement("script");
    script.src = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
    script.async = true;
    script.onerror = onError;
    document.head.appendChild(script);
  }

  function renderMesa42(payload) {
    const card = document.querySelector("[data-mesa42-promo]");
    if (!card || !payload) return;

    const latest = payload.latest || payload.ultima || payload.post || payload;
    const siteUrl = safeUrl(
      payload.siteUrl || payload.site_url || "https://mesa42.cianortecardmasters.com.br/",
      "https://mesa42.cianortecardmasters.com.br/"
    );

    const url = safeUrl(latest.url || latest.link, siteUrl);
    const image = safeUrl(latest.image || latest.imagem || latest.cover || latest.capa, "");
    const title = textValue(latest.title, latest.titulo);
    const summary = textValue(latest.summary, latest.resumo, latest.description, latest.descricao);
    const category = textValue(latest.category, latest.categoria, latest.type, latest.tipo);
    const readingRaw = latest.readingTime ?? latest.tempoLeitura ?? latest.reading_time;
    const reading = readingRaw
      ? (/min/i.test(String(readingRaw)) ? String(readingRaw) : `${readingRaw} min de leitura`)
      : "";

    card.href = url;

    const titleEl = card.querySelector("[data-mesa42-title]");
    const summaryEl = card.querySelector("[data-mesa42-summary]");
    const readingEl = card.querySelector("[data-mesa42-reading]");
    const categoryEl = card.querySelector("[data-mesa42-category]");
    const imageEl = card.querySelector("[data-mesa42-image]");

    if (title && titleEl) titleEl.textContent = title;
    if (category && categoryEl) categoryEl.textContent = category;
    if (summary && summaryEl) summaryEl.textContent = summary;
    if (reading && readingEl) readingEl.textContent = reading;

    if (image && imageEl) {
      imageEl.src = image;
      imageEl.alt = title ? `Imagem de ${title}` : "Imagem da publicação mais recente do Mesa42";
    }

    card.classList.add("is-live");
  }

  function renderZine(payload) {
    const card = document.querySelector("[data-zine-promo]");
    if (!card || !payload) return;

    const latest = payload.latest || payload.ultima || payload.issue || payload;
    const siteUrl = safeUrl(
      payload.siteUrl || payload.site_url || payload.repositoryUrl || payload.repository_url,
      "https://revista.cianortecardmasters.com.br/"
    );

    const editionRaw = textValue(latest.edition, latest.edicao, latest.number, latest.numero);
    const editionCodeMatch = String(editionRaw || "").match(/\d+/);
    const editionCode = editionCodeMatch ? editionCodeMatch[0].padStart(3, "0") : "001";
    const edition = editionRaw
      ? (/edi/i.test(editionRaw) ? editionRaw : `Edição ${editionCode}`)
      : `Edição ${editionCode}`;

    const issueUrl = safeUrl(latest.url || latest.link, siteUrl);
    const coverFallback = `${siteUrl.replace(/\/$/, "")}/data/capas/${editionCode}.jpg`;
    const cover = safeUrl(latest.cover || latest.capa || latest.image || latest.imagem, coverFallback);

    card.href = issueUrl;

    const editionEl = document.querySelector("[data-zine-edition]");
    const coverEl = card.querySelector("[data-zine-cover]");

    if (editionEl) editionEl.textContent = edition;

    if (coverEl) {
      let triedFallback = false;
      coverEl.onerror = () => {
        if (!triedFallback && coverEl.src !== coverFallback) {
          triedFallback = true;
          coverEl.src = coverFallback;
        }
      };
      coverEl.src = cover || coverFallback;
      coverEl.alt = `CC Master Zine — ${edition}`;
    }

    card.classList.add("is-live");
  }

  globalThis.addEventListener("mesa42:latest", (event) => renderMesa42(event.detail));
  globalThis.addEventListener("ccmasters-zine:latest", (event) => renderZine(event.detail));

  // Também aceita os objetos globais caso os feeds sejam carregados antes deste script.
  if (globalThis.Mesa42Latest) renderMesa42(globalThis.Mesa42Latest);
  if (globalThis.CCMastersZineLatest) renderZine(globalThis.CCMastersZineLatest);

  // Os dois arquivos serão criados/atualizados nos respectivos sites.
  // Se ainda não existirem, a Home mantém os fallbacks definidos no HTML.
  loadFeed(MESA42_FEED, () => {});
  loadFeed(ZINE_FEED, () => {});
})();
