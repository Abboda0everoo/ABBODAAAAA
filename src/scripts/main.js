// Ampliq website: progressive enhancements. Every page is complete without JS.
(() => {
  const config = JSON.parse(document.getElementById("site-config")?.textContent || "{}");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.dataLayer = window.dataLayer || [];
  const track = (event, data = {}) => window.dataLayer.push({ event, ...data });

  // ---------- Mobile menu ----------
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");
  const setMenu = (open) => {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };
  toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 1025px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

  // ---------- Header shrinks once the page scrolls ----------
  const header = document.querySelector(".site-header");
  const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Language switch keeps the current section ----------
  document.querySelectorAll("[data-lang-switch]").forEach((a) =>
    a.addEventListener("click", () => {
      if (!window.location.hash) return;
      const url = new URL(a.href);
      url.hash = window.location.hash;
      a.href = url.href;
    })
  );

  // ---------- Hero rotator ----------
  const word = document.querySelector("[data-rotator]");
  if (word && !reduceMotion) {
    const words = JSON.parse(word.dataset.rotator);
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      word.classList.add("is-out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        word.textContent = words[i];
        word.classList.remove("is-out");
      }, 350);
    }, 2800);
  }

  // ---------- Blog: filter by category and search ----------
  const tools = document.querySelector("[data-blog-tools]");
  if (tools) {
    tools.hidden = false;
    const cards = [...document.querySelectorAll("[data-blog-list] .post-card")];
    const empty = document.querySelector("[data-blog-empty]");
    const search = tools.querySelector("[data-blog-search]");
    let category = "all";
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach((c) => {
        const ok = (category === "all" || c.dataset.category === category) && (!q || c.dataset.search.includes(q));
        c.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown > 0;
    };
    tools.querySelectorAll("[data-filter]").forEach((b) =>
      b.addEventListener("click", () => {
        category = b.dataset.filter;
        tools.querySelectorAll("[data-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        apply();
      })
    );
    search.addEventListener("input", apply);
  }

  // ---------- Article share ----------
  const shareBar = document.querySelector("[data-share-bar]");
  if (shareBar) {
    const here = encodeURIComponent(window.location.href.split("#")[0]);
    const targets = { x: `https://x.com/intent/post?url=${here}`, linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${here}`, whatsapp: `https://wa.me/?text=${here}` };
    shareBar.querySelectorAll("[data-share]").forEach((a) => {
      if (a.getAttribute("href") === "#") a.href = targets[a.dataset.share];
    });
    const copy = shareBar.querySelector("[data-copy-link]");
    const status = shareBar.querySelector(".copy-status");
    copy?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href.split("#")[0]);
        status.textContent = copy.dataset.copied;
        setTimeout(() => (status.textContent = ""), 2500);
      } catch {
        window.prompt("", window.location.href.split("#")[0]);
      }
    });
  }

  // ---------- WhatsApp button mentions the current page ----------
  const wa = document.querySelector(".wa-float");
  if (wa) wa.href = `${wa.dataset.waBase}?text=${encodeURIComponent(`${wa.dataset.waText} ${document.title} — ${window.location.href.split("#")[0]}`)}`;

  // ---------- Conversion events for direct contact ----------
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-contact]");
    if (link) track("contact_click", { method: link.dataset.contact });
  });

  // ---------- Contact form ----------
  const MOBILE = /^(?:\+?966|0)?5\d{8}$/;
  document.querySelectorAll("[data-form]").forEach((form) => {
    const msg = form.dataset;
    const status = form.querySelector(".form-status");
    const button = form.querySelector('button[type="submit"]');
    const label = button.innerHTML;

    const showStatus = (kind, text) => {
      status.hidden = false;
      status.className = `form-status is-${kind}`;
      status.textContent = text;
    };
    const setError = (el, text) => {
      const err = form.querySelector(`#${el.id}-error`);
      el.setAttribute("aria-invalid", text ? "true" : "false");
      if (err) { err.textContent = text; err.hidden = !text; }
    };
    const check = (el) => {
      const v = el.type === "checkbox" ? el.checked : el.value.trim();
      let text = "";
      if (el.required && !v) text = el.type === "checkbox" ? msg.msgConsent : msg.msgRequired;
      else if (v && el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) text = msg.msgEmail;
      else if (v && el.hasAttribute("data-saudi-mobile") && !MOBILE.test(v.replace(/[\s-]/g, ""))) text = msg.msgMobile;
      setError(el, text);
      return !text;
    };
    const fields = [...form.querySelectorAll("input:not([name=website]), select, textarea")];
    fields.forEach((el) => {
      el.addEventListener("blur", () => { if (el.value || el.getAttribute("aria-invalid") === "true") check(el); });
      el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") check(el); });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const invalid = fields.filter((el) => !check(el));
      if (invalid.length) {
        showStatus("error", msg.msgSummary);
        invalid[0].focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form));
      if (data.website) return; // honeypot: bots fill hidden fields
      delete data.website;
      data.page = window.location.href;
      data.language = config.lang;

      if (config.formEndpoint) {
        button.disabled = true;
        button.textContent = msg.msgSending;
        try {
          const res = await fetch(config.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          showStatus("success", msg.msgSuccess);
          track("generate_lead", { form: form.id, service: data.service || "" });
        } catch {
          showStatus("error", msg.msgFailed);
        } finally {
          button.disabled = false;
          button.innerHTML = label;
        }
        return;
      }
      if (config.email) {
        const lines = fields
          .filter((el) => el.name !== "consent")
          .map((el) => `${form.querySelector(`label[for="${el.id}"]`)?.textContent.replace("*", "").trim()}: ${el.value.trim()}`);
        window.location.href = `mailto:${config.email}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
        showStatus("info", msg.msgMailto);
        track("generate_lead", { form: form.id, method: "email" });
        return;
      }
      showStatus("info", msg.msgNotConnected);
    });
  });

  // ---------- Cookie consent → Google Tag Manager ----------
  if (config.gtmId) {
    const KEY = "ampliq-consent";
    const banner = document.querySelector("[data-consent]");
    const loadGtm = () => {
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmId)}`;
      document.head.appendChild(s);
    };
    let choice = null;
    try { choice = localStorage.getItem(KEY); } catch { /* storage unavailable */ }
    if (choice === "granted") loadGtm();
    else if (choice !== "denied" && banner) banner.hidden = false;
    banner?.querySelectorAll("[data-consent-choice]").forEach((b) =>
      b.addEventListener("click", () => {
        const value = b.dataset.consentChoice;
        try { localStorage.setItem(KEY, value); } catch { /* storage unavailable */ }
        banner.hidden = true;
        if (value === "granted") loadGtm();
      })
    );
  }
})();
