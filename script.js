const revealTargets = document.querySelectorAll(".hero-copy, .hero-card");

revealTargets.forEach((element, index) => {
  element.dataset.reveal = "";
  element.style.animationDelay = `${index * 24}ms`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
  }
);

revealTargets.forEach((element) => revealObserver.observe(element));

const sectionCurrent = document.querySelector("[data-section-current]");
const sectionNames = {
  top: "START",
  tjanster: "TJÄNSTER",
  projekt: "PROJEKT",
  medarbetare: "MEDARBETARE",
  "om-oss": "OM OSS",
  kontakt: "KONTAKT",
};

const sections = ["top", "tjanster", "projekt", "medarbetare", "om-oss", "kontakt"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const setActiveSection = (id) => {
  if (sectionCurrent) {
    sectionCurrent.textContent = sectionNames[id] || "START";
  }
};

const sectionObserver = new IntersectionObserver(
  (entries) => {
    if (window.scrollY < 160) {
      setActiveSection("top");
      return;
    }

    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visibleEntries.length > 0) {
      setActiveSection(visibleEntries[0].target.id);
    }
  },
  {
    rootMargin: "-20% 0px -55% 0px",
    threshold: [0.15, 0.35, 0.55],
  }
);

sections.forEach((section) => sectionObserver.observe(section));

window.addEventListener(
  "scroll",
  () => {
    if (window.scrollY < 160) {
      setActiveSection("top");
    }
    updateStickyFooterVisibility();
  },
  { passive: true }
);

const supabaseUrl = "https://hedcfvuaqhddqvkrcajn.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZGNmdnVhcWhkZHF2a3JjYWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0Mjk5NTEsImV4cCI6MjA5MjAwNTk1MX0.92i5MvhPYrL_6TrtQqfYWBsIvQ87-gopJGTmuOKgxVg";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
const HERO_SETTINGS_CACHE_KEY = "eklund_site_settings_hero";

const heroBackdrop = document.querySelector(".hero-backdrop");
const stickyFooter = document.querySelector(".sticky-footer");
const projectTypeButtons = document.querySelectorAll("[data-project-type]");
const projectsGrid = document.getElementById("projects-grid");
const employeesGrid = document.getElementById("employees-grid");
const projectModal = document.getElementById("project-modal");
const projectModalClose = document.getElementById("project-modal-close");
const projectModalMedia = document.getElementById("project-modal-media");
const projectModalTitle = document.getElementById("project-modal-title");
const projectModalShort = document.getElementById("project-modal-short");
const projectModalBody = document.getElementById("project-modal-body");
const employeeModal = document.getElementById("employee-modal");
const employeeModalClose = document.getElementById("employee-modal-close");
const employeeModalMedia = document.getElementById("employee-modal-media");
const employeeModalTitle = document.getElementById("employee-modal-title");
const employeeModalRole = document.getElementById("employee-modal-role");
const employeeModalBody = document.getElementById("employee-modal-body");
const projectTypeModal = document.getElementById("project-type-modal");
const projectTypeModalClose = document.getElementById("project-type-modal-close");
const projectTypeModalTitle = document.getElementById("project-type-modal-title");
const projectTypeModalBody = document.getElementById("project-type-modal-body");

const updateStickyFooterVisibility = () => {
  if (!stickyFooter) return;
  stickyFooter.classList.toggle("is-visible", window.scrollY > 180);
};

const projectTypeContent = {
  "kommersiella-byggnader": {
    title: "Kommersiella byggnader",
    body:
      "Vi arbetar med kommersiella byggnader där funktion, flöden och hållbara bygglösningar behöver samspela. Projekten kan omfatta både nybyggnation, tillbyggnad och avancerade montage i trä.",
  },
  lager: {
    title: "Lager",
    body:
      "Lagerprojekt kräver ofta tydlig logistik, robust konstruktion och effektiv projektsamordning. Vi hjälper till från planering till genomförande med fokus på kvalitet och precision.",
  },
  kontor: {
    title: "Kontor",
    body:
      "Vi genomför kontorsprojekt där både byggteknik och användarvänliga miljöer behöver fungera tillsammans. Det kan handla om nya kontorsytor, anpassningar eller tillbyggnader.",
  },
  maskinhall: {
    title: "Maskinhall",
    body:
      "Maskinhallar ställer krav på rätt bärighet, smart utformning och lösningar som fungerar i vardagen. Vi tar fram genomtänkta bygglösningar anpassade efter verksamheten.",
  },
  garage: {
    title: "Garage",
    body:
      "Vi blockbygger ditt garage och monterar på en dag. Våra garage kan med fördel kombineras med carport och/eller förråd. Du väljer storlek och utseende och vi hjälper dig med bygglovsprocessen.",
  },
  attefallare: {
    title: "Attefallare",
    body:
      "Vi hjälper till med attefallare som behöver vara både välplanerade och smidiga att genomföra. Fokus ligger på smarta lösningar, god byggteknik och ett effektivt utförande.",
  },
  altaner: {
    title: "Altaner",
    body:
      "Altanprojekt kan vara små i skala men kräver fortfarande rätt materialval, noggrannhet och ett säkert utförande. Vi bygger lösningar som fungerar över tid och passar helheten runt fastigheten.",
  },
};

const escapeHtml = (value = "") =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const paragraphize = (text = "") =>
  text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

const uniqueImages = (images) =>
  [...new Set((images || []).filter(Boolean).map((image) => image.trim()).filter(Boolean))];

const keywordToPercent = {
  left: "0%",
  center: "50%",
  right: "100%",
  top: "0%",
  bottom: "100%",
};

const EMPLOYEE_PRIORITY_MATCHERS = [
  { order: 0, matches: ["camilla eklund", "camilla"] },
  { order: 1, matches: ["christer eklund", "christer"] },
  { order: 2, matches: ["freddan", "fredrik", "fred"] },
];

const normalizeComparableName = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getEmployeePriorityOrder = (name = "") => {
  const normalizedName = normalizeComparableName(name);
  const match = EMPLOYEE_PRIORITY_MATCHERS.find((entry) =>
    entry.matches.some((candidate) => normalizedName.includes(candidate))
  );

  return match ? match.order : null;
};

const sortEmployees = (employees = []) =>
  [...employees].sort((a, b) => {
    const priorityA = getEmployeePriorityOrder(a.name);
    const priorityB = getEmployeePriorityOrder(b.name);

    if (priorityA !== null || priorityB !== null) {
      if (priorityA === null) return 1;
      if (priorityB === null) return -1;
      if (priorityA !== priorityB) return priorityA - priorityB;
    }

    const sortOrderA = Number(a.sort_order ?? 0);
    const sortOrderB = Number(b.sort_order ?? 0);
    if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;

    return (a.name || "").localeCompare(b.name || "", "sv");
  });

const normalizeHeroPosition = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) return "50% 50%";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 2 && parts.every((part) => /^-?\d+(\.\d+)?%$/.test(part))) {
    return `${parts[0]} ${parts[1]}`;
  }

  if (parts.length === 2) {
    const x = keywordToPercent[parts[0]] || "50%";
    const y = keywordToPercent[parts[1]] || "50%";
    return `${x} ${y}`;
  }

  return "50% 50%";
};

const loadCachedHeroSettings = () => {
  try {
    const raw = window.localStorage.getItem(HERO_SETTINGS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
};

const saveCachedHeroSettings = (settings) => {
  try {
    window.localStorage.setItem(HERO_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch (_error) {}
};

const escapeCssUrl = (value = "") => value.replace(/["\\]/g, "\\$&");

const heroLoadState = {
  requestId: 0,
  appliedUrl: "",
};

const setHeroBackground = (imageUrl, imagePosition = "50% 50%") => {
  if (!heroBackdrop) return;

  const heroImage = imageUrl?.trim() || "hero-bg.jpg";
  const normalizedPosition = normalizeHeroPosition(imagePosition);

  document.documentElement.style.setProperty("--hero-image-position", normalizedPosition);

  if (heroLoadState.appliedUrl === heroImage) {
    document.documentElement.classList.add("hero-image-ready");
    return;
  }

  const requestId = ++heroLoadState.requestId;
  const preloadImage = new Image();
  preloadImage.decoding = "async";

  const applyHeroImage = () => {
    if (requestId !== heroLoadState.requestId) return;

    heroLoadState.appliedUrl = heroImage;
    document.documentElement.style.setProperty("--hero-image-url", `url("${escapeCssUrl(heroImage)}")`);
    document.documentElement.style.setProperty("--hero-image-position", normalizedPosition);
    document.documentElement.classList.add("hero-image-ready");
  };

  preloadImage.onload = applyHeroImage;
  preloadImage.onerror = applyHeroImage;
  preloadImage.src = heroImage;

  if (preloadImage.complete && preloadImage.naturalWidth > 0) {
    applyHeroImage();
  }
};

const renderProjectModalMedia = (project) => {
  const images = uniqueImages([project.thumbnail_url, ...(project.gallery_images || [])]);

  if (!images.length) {
    projectModalMedia.innerHTML = "";
    return;
  }

  const mainImage = images[0];
  const thumbsHtml =
    images.length > 1
      ? `
        <div class="project-modal-thumbs" aria-label="Fler projektbilder">
          ${images
            .map(
              (image, index) => `
                <button class="project-modal-thumb${index === 0 ? " is-active" : ""}" type="button" data-project-thumb="${escapeHtml(image)}" aria-label="Visa bild ${index + 1}">
                  <img src="${image}" alt="${escapeHtml(project.title || "Projektbild")} ${index + 1}" />
                </button>
              `
            )
            .join("")}
        </div>
      `
      : "";

  projectModalMedia.innerHTML = `
    <div class="project-modal-main-image">
      <img src="${mainImage}" alt="${escapeHtml(project.title || "Projektbild")}" data-project-main-image />
    </div>
    ${thumbsHtml}
  `;

  const mainImageElement = projectModalMedia.querySelector("[data-project-main-image]");
  const thumbButtons = projectModalMedia.querySelectorAll("[data-project-thumb]");

  thumbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.getAttribute("data-project-thumb");
      if (!image || !mainImageElement) return;

      mainImageElement.src = image;
      thumbButtons.forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });
};

const openProjectModal = (project) => {
  projectModalTitle.textContent = project.title || "";
  projectModalShort.textContent = project.short_description || "";
  projectModalBody.innerHTML = paragraphize(project.long_description || "");
  renderProjectModalMedia(project);

  projectModal.showModal();
};

const openEmployeeModal = (employee) => {
  employeeModalTitle.textContent = employee.name || "";
  employeeModalRole.textContent = employee.role || "";
  employeeModalBody.innerHTML = paragraphize(employee.bio || "");

  if (employee.photo_url) {
    employeeModalMedia.innerHTML = `<img src="${employee.photo_url}" alt="${escapeHtml(employee.name || "Medarbetare")}" />`;
  } else {
    employeeModalMedia.innerHTML = "";
  }

  employeeModal.showModal();
};

const closeProjectModal = () => {
  if (projectModal.open) {
    projectModal.close();
  }
};

const closeEmployeeModal = () => {
  if (employeeModal.open) {
    employeeModal.close();
  }
};

const openProjectTypeModal = (typeKey) => {
  const content = projectTypeContent[typeKey];
  if (!content || !projectTypeModal) return;

  projectTypeModalTitle.textContent = content.title;
  projectTypeModalBody.innerHTML = paragraphize(content.body || "");
  projectTypeModal.showModal();
};

const closeProjectTypeModal = () => {
  if (projectTypeModal?.open) {
    projectTypeModal.close();
  }
};

projectModalClose?.addEventListener("click", closeProjectModal);
projectModal?.addEventListener("click", (event) => {
  const rect = projectModal.getBoundingClientRect();
  const clickedInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!clickedInDialog) {
    closeProjectModal();
  }
});

employeeModalClose?.addEventListener("click", closeEmployeeModal);
employeeModal?.addEventListener("click", (event) => {
  const rect = employeeModal.getBoundingClientRect();
  const clickedInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!clickedInDialog) {
    closeEmployeeModal();
  }
});

projectTypeModalClose?.addEventListener("click", closeProjectTypeModal);
projectTypeModal?.addEventListener("click", (event) => {
  const rect = projectTypeModal.getBoundingClientRect();
  const clickedInDialog =
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width;

  if (!clickedInDialog) {
    closeProjectTypeModal();
  }
});

projectTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const typeKey = button.getAttribute("data-project-type");
    if (!typeKey) return;
    openProjectTypeModal(typeKey);
  });
});

const renderProjects = (projects) => {
  if (!projectsGrid) return;

  if (!projects.length) {
    projectsGrid.innerHTML = `
      <article class="service-card project-card project-card-placeholder">
        <h3>Inga projekt publicerade ännu</h3>
        <p>När ni lägger in projekt i admin kommer de att visas här automatiskt.</p>
      </article>
    `;
    return;
  }

  projectsGrid.innerHTML = "";

  projects.forEach((project) => {
    const card = document.createElement("article");
    card.className = "service-card project-card";
    card.tabIndex = 0;

    const imageHtml = project.thumbnail_url
      ? `<div class="project-card-media"><img src="${project.thumbnail_url}" alt="${escapeHtml(project.title || "Projektbild")}" /></div>`
      : "";

    card.innerHTML = `
      ${imageHtml}
      <h3 class="project-card-title">${escapeHtml(project.title || "Untitled project")}</h3>
      <p class="project-card-text">${escapeHtml(project.short_description || "")}</p>
    `;

    card.addEventListener("click", () => openProjectModal(project));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProjectModal(project);
      }
    });

    projectsGrid.appendChild(card);
  });
};

const renderEmployees = (employees) => {
  if (!employeesGrid) return;

  if (!employees.length) {
    employeesGrid.innerHTML = `
      <article class="service-card employee-card employee-card-placeholder">
        <h3>Inga medarbetare publicerade ännu</h3>
        <p>När ni lägger in aktiva medarbetare i admin kommer de att visas här automatiskt.</p>
      </article>
    `;
    return;
  }

  employeesGrid.innerHTML = "";

  employees.forEach((employee) => {
    const card = document.createElement("article");
    card.className = "service-card employee-card";
    card.tabIndex = 0;

    const imageHtml = employee.photo_url
      ? `<div class="employee-card-media"><img src="${employee.photo_url}" alt="${escapeHtml(employee.name || "Medarbetare")}" /></div>`
      : "";

    const roleHtml = employee.role
      ? `<p class="employee-card-role">${escapeHtml(employee.role)}</p>`
      : "";

    const emailHtml = employee.email
      ? `<a class="employee-card-email" href="mailto:${escapeHtml(employee.email)}">${escapeHtml(employee.email)}</a>`
      : "";

    card.innerHTML = `
      ${imageHtml}
      <h3 class="employee-card-title">${escapeHtml(employee.name || "Namnlös medarbetare")}</h3>
      ${roleHtml}
      ${emailHtml}
    `;

    card.addEventListener("click", () => openEmployeeModal(employee));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEmployeeModal(employee);
      }
    });

    employeesGrid.appendChild(card);
  });
};

const loadProjects = async () => {
  const { data, error } = await supabaseClient
    .from("projects")
    .select("id, title, slug, thumbnail_url, short_description, long_description, published_at, created_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    if (projectsGrid) {
      projectsGrid.innerHTML = `
        <article class="service-card project-card project-card-placeholder">
          <h3>Kunde inte ladda projekt</h3>
          <p>Kontrollera att tabellen innehåller publicerade projekt och att policys är aktiva.</p>
        </article>
      `;
    }
    return;
  }

  const projects = data || [];
  const projectIds = projects.map((project) => project.id).filter(Boolean);

  if (projectIds.length) {
    const { data: galleryData, error: galleryError } = await supabaseClient
      .from("project_images")
      .select("project_id, image_url, sort_order, created_at")
      .in("project_id", projectIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!galleryError && galleryData) {
      const galleryByProject = galleryData.reduce((accumulator, image) => {
        if (!accumulator[image.project_id]) {
          accumulator[image.project_id] = [];
        }
        accumulator[image.project_id].push(image.image_url);
        return accumulator;
      }, {});

      projects.forEach((project) => {
        project.gallery_images = galleryByProject[project.id] || [];
      });
    }
  }

  renderProjects(projects);
};

const loadEmployees = async () => {
  const { data, error } = await supabaseClient
    .from("employees")
    .select("id, name, role, email, photo_url, bio, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(8);

  if (error) {
    if (employeesGrid) {
      employeesGrid.innerHTML = `
        <article class="service-card employee-card employee-card-placeholder">
          <h3>Kunde inte ladda medarbetare</h3>
          <p>Kontrollera att tabellen innehåller aktiva medarbetare och att policys är aktiva.</p>
        </article>
      `;
    }
    return;
  }

  renderEmployees(sortEmployees(data || []));
};

const loadSiteSettings = async () => {
  const cachedHeroSettings = loadCachedHeroSettings();
  if (cachedHeroSettings) {
    setHeroBackground(cachedHeroSettings.hero_image_url || "", cachedHeroSettings.hero_image_position || "50% 50%");
  } else {
    setHeroBackground("", "50% 50%");
  }

  const { data, error } = await supabaseClient
    .from("site_settings")
    .select("key, value_text")
    .in("key", ["hero_image_url", "hero_image_position"]);

  if (error) {
    return;
  }

  const heroSetting = (data || []).find((item) => item.key === "hero_image_url");
  const heroPositionSetting = (data || []).find((item) => item.key === "hero_image_position");
  const heroSettings = {
    hero_image_url: heroSetting?.value_text || "",
    hero_image_position: heroPositionSetting?.value_text || "50% 50%",
  };
  saveCachedHeroSettings(heroSettings);
  setHeroBackground(heroSettings.hero_image_url, heroSettings.hero_image_position);
};

loadSiteSettings();
loadProjects();
loadEmployees();
updateStickyFooterVisibility();
