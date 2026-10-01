// AMPLIQ website: small progressive enhancements. The page works without JS.
(() => {
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
  nav?.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle?.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      toggle.focus();
    }
  });
  window.matchMedia("(min-width: 1081px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });

  // ---------- Header border once the page scrolls ----------
  const header = document.querySelector(".site-header");
  const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Language switch keeps the current section ----------
  document.querySelectorAll("[data-lang-switch]").forEach((a) => {
    a.addEventListener("click", () => {
      const url = new URL(a.href);
      url.hash = window.location.hash;
      a.href = url.href;
    });
  });

  if (!("IntersectionObserver" in window)) return;

  // ---------- Highlight the nav item for the section in view ----------
  const links = new Map();
  document.querySelectorAll(".nav a[data-nav]").forEach((a) => links.set(a.dataset.nav, a));
  const sections = document.querySelectorAll("main section[data-nav]");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const key = entry.target.dataset.nav;
        links.forEach((a, k) => {
          if (k === key) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));
})();

// ---------- Contact form: opens the visitor's email app with the message filled in ----------
(() => {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const lines = [...form.querySelectorAll(".field")].map((field) => {
      const label = field.querySelector("label")?.textContent.trim();
      const input = field.querySelector("input, select, textarea");
      return `${label}: ${input?.value.trim() ?? ""}`;
    });
    const subject = encodeURIComponent(form.dataset.subject || "");
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${form.dataset.mailto}?subject=${subject}&body=${body}`;
  });
})();
