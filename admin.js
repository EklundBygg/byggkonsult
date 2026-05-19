const supabaseUrl = "https://hedcfvuaqhddqvkrcajn.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZGNmdnVhcWhkZHF2a3JjYWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0Mjk5NTEsImV4cCI6MjA5MjAwNTk1MX0.92i5MvhPYrL_6TrtQqfYWBsIvQ87-gopJGTmuOKgxVg";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
const HERO_SETTINGS_CACHE_KEY = "eklund_site_settings_hero";

const authCard = document.getElementById("auth-card");
const adminApp = document.getElementById("admin-app");
const loginForm = document.getElementById("login-form");
const authStatus = document.getElementById("auth-status");
const signOutButton = document.getElementById("sign-out-button");
const saveSiteSettingsButton = document.getElementById("save-site-settings-button");
const siteSettingsStatus = document.getElementById("site-settings-status");
const heroImageUrl = document.getElementById("hero-image-url");
const heroImageFile = document.getElementById("hero-image-file");
const heroImagePosition = document.getElementById("hero-image-position");
const heroImagePositionReadout = document.getElementById("hero-image-position-readout");
const uploadHeroImageButton = document.getElementById("upload-hero-image-button");
const heroImagePreview = document.getElementById("hero-image-preview");

const projectList = document.getElementById("project-list");
const newProjectButton = document.getElementById("new-project-button");
const saveProjectButton = document.getElementById("save-project-button");
const deleteProjectButton = document.getElementById("delete-project-button");
const projectStatus = document.getElementById("project-status");
const editorTitle = document.getElementById("editor-title");

const projectTitle = document.getElementById("project-title");
const projectSlug = document.getElementById("project-slug");
const projectPublished = document.getElementById("project-published");
const projectPublishedAt = document.getElementById("project-published-at");
const projectSortOrder = document.getElementById("project-sort-order");
const projectShortDescription = document.getElementById("project-short-description");
const projectLongDescription = document.getElementById("project-long-description");
const projectThumbnailUrl = document.getElementById("project-thumbnail-url");
const projectImageFile = document.getElementById("project-image-file");
const uploadImageButton = document.getElementById("upload-image-button");
const projectImagePreview = document.getElementById("project-image-preview");
const projectGalleryImageFile = document.getElementById("project-gallery-image-file");
const uploadProjectGalleryImageButton = document.getElementById("upload-project-gallery-image-button");
const projectGalleryList = document.getElementById("project-gallery-list");

const employeeList = document.getElementById("employee-list");
const newEmployeeButton = document.getElementById("new-employee-button");
const saveEmployeeButton = document.getElementById("save-employee-button");
const deleteEmployeeButton = document.getElementById("delete-employee-button");
const employeeStatus = document.getElementById("employee-status");
const employeeEditorTitle = document.getElementById("employee-editor-title");
const employeeName = document.getElementById("employee-name");
const employeeRole = document.getElementById("employee-role");
const employeeEmail = document.getElementById("employee-email");
const employeePhone = document.getElementById("employee-phone");
const employeeSortOrder = document.getElementById("employee-sort-order");
const employeeActive = document.getElementById("employee-active");
const employeePhotoUrl = document.getElementById("employee-photo-url");
const employeePhotoUrlSecondary = document.getElementById("employee-photo-url-secondary");
const employeeBio = document.getElementById("employee-bio");
const employeeImageFile = document.getElementById("employee-image-file");
const uploadEmployeeImageButton = document.getElementById("upload-employee-image-button");
const employeeImagePreview = document.getElementById("employee-image-preview");

let currentProjectId = null;
let currentProjects = [];
let currentProjectImages = [];
let currentEmployeeId = null;
let currentEmployees = [];
let currentSiteSettings = {
  hero_image_url: "",
  hero_image_position: "50% 50%",
};
let isDraggingHeroPreview = false;
let slugWasManuallyEdited = false;
const PROJECT_DRAFT_KEY = "eklund_admin_project_draft";
const EMPLOYEE_DRAFT_KEY = "eklund_admin_employee_draft";

const setStatus = (element, message, isError = false) => {
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "#ffb8ae" : "";
};

const slugify = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const getNextEmployeeSortOrder = () => {
  const maxExistingSortOrder = currentEmployees.reduce((highest, employee) => {
    const priorityOrder = getEmployeePriorityOrder(employee.name);
    if (priorityOrder !== null) {
      return highest;
    }

    return Math.max(highest, Number(employee.sort_order ?? 0));
  }, 2);

  return maxExistingSortOrder + 1;
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getDefaultPublishedAt = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const getStoragePathFromPublicUrl = (url, bucketName) => {
  if (!url) return null;

  const marker = `/storage/v1/object/public/${bucketName}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  return url
    .slice(index + marker.length)
    .split("?")[0]
    .split("#")[0];
};

const renderImagePreview = (url) => {
  if (!url) {
    projectImagePreview.innerHTML = '<div class="image-preview-empty">Ingen bild vald ännu</div>';
    return;
  }

  projectImagePreview.innerHTML = `<img src="${url}" alt="Projektbild" />`;
};

const renderHeroImagePreview = (url) => {
  if (!heroImagePreview) return;

  if (!url) {
    heroImagePreview.innerHTML = '<div class="image-preview-empty">Ingen hero-bild vald ännu</div>';
    heroImagePreview.style.backgroundImage = "none";
    return;
  }

  heroImagePreview.innerHTML = "";
  heroImagePreview.style.backgroundImage = `url("${url}")`;
  updateHeroPreviewPosition(heroImagePosition.value || "50% 50%");
};

const keywordToPercent = {
  left: "0%",
  center: "50%",
  right: "100%",
  top: "0%",
  bottom: "100%",
};

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

const parseHeroPosition = (value = "") => {
  const normalized = normalizeHeroPosition(value);
  const [x = "50%", y = "50%"] = normalized.split(" ");
  return { x, y, normalized };
};

const updateHeroPreviewPosition = (value = "50% 50%") => {
  if (!heroImagePreview || !heroImagePosition) return;

  const { x, y, normalized } = parseHeroPosition(value);
  heroImagePosition.value = normalized;
  heroImagePreview.style.backgroundPosition = normalized;
  heroImagePreview.style.setProperty("--hero-focus-x", x);
  heroImagePreview.style.setProperty("--hero-focus-y", y);

  const xValue = Number.parseFloat(x) || 50;
  const yValue = Number.parseFloat(y) || 50;
  heroImagePreview.setAttribute("aria-valuetext", `${Math.round(xValue)} procent horisontellt, ${Math.round(yValue)} procent vertikalt`);
  heroImagePreview.setAttribute("aria-valuenow", String(Math.round(xValue)));

  if (heroImagePositionReadout) {
    heroImagePositionReadout.textContent = `${Math.round(xValue)}% / ${Math.round(yValue)}%`;
  }
};

const setHeroPositionFromPointer = (clientX, clientY) => {
  if (!heroImagePreview || !heroImageUrl.value.trim()) return;

  const rect = heroImagePreview.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
  updateHeroPreviewPosition(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
};

const renderProjectGalleryList = () => {
  if (!projectGalleryList) return;

  if (!currentProjectId) {
    projectGalleryList.innerHTML = '<div class="gallery-list-empty">Spara projektet och ladda sedan upp fler bilder här.</div>';
    return;
  }

  if (!currentProjectImages.length) {
    projectGalleryList.innerHTML = '<div class="gallery-list-empty">Inga extra bilder ännu.</div>';
    return;
  }

  projectGalleryList.innerHTML = "";

  currentProjectImages.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "gallery-list-item";
    item.innerHTML = `
      <img src="${image.image_url}" alt="Projektbild ${index + 1}" />
      <div class="gallery-list-meta">
        <strong>Bild ${index + 1}</strong>
        <small>${image.image_url}</small>
      </div>
      <button class="danger-button" type="button" data-project-image-delete="${image.id}">Ta bort</button>
    `;

    const deleteButton = item.querySelector("[data-project-image-delete]");
    deleteButton?.addEventListener("click", () => deleteProjectGalleryImage(image.id));
    projectGalleryList.appendChild(item);
  });
};

const renderEmployeeImagePreview = (url) => {
  if (!url) {
    employeeImagePreview.innerHTML = '<div class="image-preview-empty">Ingen bild vald ännu</div>';
    return;
  }

  employeeImagePreview.innerHTML = `<img src="${url}" alt="Medarbetarbild" />`;
};

const getSiteSettingsPayload = () => ({
  hero_image_url: {
    key: "hero_image_url",
    value_text: heroImageUrl.value.trim() || null,
  },
  hero_image_position: {
    key: "hero_image_position",
    value_text: normalizeHeroPosition(heroImagePosition.value || "50% 50%"),
  },
});

const getProjectPayload = () => ({
  title: projectTitle.value.trim(),
  slug: projectSlug.value.trim(),
  thumbnail_url: projectThumbnailUrl.value.trim() || null,
  short_description: projectShortDescription.value.trim() || null,
  long_description: projectLongDescription.value.trim() || null,
  published_at: projectPublishedAt.value ? `${projectPublishedAt.value}T12:00:00` : null,
  is_published: projectPublished.value === "true",
  sort_order: Number(projectSortOrder.value || 0),
});

const saveDraft = (key, payload) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (_error) {}
};

const loadDraft = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
};

const clearDraft = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch (_error) {}
};

const saveCachedHeroSettings = (settings) => {
  try {
    window.localStorage.setItem(HERO_SETTINGS_CACHE_KEY, JSON.stringify(settings));
  } catch (_error) {}
};

const persistProjectDraft = () => {
  saveDraft(PROJECT_DRAFT_KEY, {
    currentProjectId,
    title: projectTitle.value,
    slug: projectSlug.value,
    published: projectPublished.value,
    publishedAt: projectPublishedAt.value,
    sortOrder: projectSortOrder.value,
    shortDescription: projectShortDescription.value,
    longDescription: projectLongDescription.value,
    thumbnailUrl: projectThumbnailUrl.value,
    editorTitle: editorTitle.textContent,
    slugWasManuallyEdited,
  });
};

const resetForm = () => {
  currentProjectId = null;
  currentProjectImages = [];
  slugWasManuallyEdited = false;
  editorTitle.textContent = "Nytt projekt";
  projectTitle.value = "";
  projectSlug.value = "";
  projectPublished.value = "true";
  projectPublishedAt.value = getDefaultPublishedAt();
  projectSortOrder.value = "0";
  projectShortDescription.value = "";
  projectLongDescription.value = "";
  projectThumbnailUrl.value = "";
  projectImageFile.value = "";
  projectGalleryImageFile.value = "";
  renderImagePreview("");
  renderProjectGalleryList();
  setStatus(projectStatus, "");
  persistProjectDraft();
};

const syncEmployeePhotoInputs = (value = "") => {
  employeePhotoUrl.value = value;
  employeePhotoUrlSecondary.value = value;
};

const getEmployeePayload = () => ({
  name: employeeName.value.trim(),
  role: employeeRole.value.trim() || null,
  email: employeeEmail.value.trim() || null,
  phone: employeePhone.value.trim() || null,
  bio: employeeBio.value.trim() || null,
  photo_url: employeePhotoUrl.value.trim() || null,
  sort_order: (() => {
    const name = employeeName.value.trim();
    const priorityOrder = getEmployeePriorityOrder(name);
    if (priorityOrder !== null) return priorityOrder;

    const explicitSortOrder = Number(employeeSortOrder.value || 0);
    if (currentEmployeeId) return explicitSortOrder;
    if (explicitSortOrder > 2) return explicitSortOrder;

    return getNextEmployeeSortOrder();
  })(),
  is_active: employeeActive.value === "true",
});

const persistEmployeeDraft = () => {
  saveDraft(EMPLOYEE_DRAFT_KEY, {
    currentEmployeeId,
    name: employeeName.value,
    role: employeeRole.value,
    email: employeeEmail.value,
    phone: employeePhone.value,
    sortOrder: employeeSortOrder.value,
    active: employeeActive.value,
    bio: employeeBio.value,
    photoUrl: employeePhotoUrl.value,
    editorTitle: employeeEditorTitle.textContent,
  });
};

const resetEmployeeForm = () => {
  currentEmployeeId = null;
  employeeEditorTitle.textContent = "Ny medarbetare";
  employeeName.value = "";
  employeeRole.value = "";
  employeeEmail.value = "";
  employeePhone.value = "";
  employeeSortOrder.value = String(getNextEmployeeSortOrder());
  employeeActive.value = "true";
  employeeBio.value = "";
  syncEmployeePhotoInputs("");
  employeeImageFile.value = "";
  renderEmployeeImagePreview("");
  setStatus(employeeStatus, "");
  persistEmployeeDraft();
};

const fillSiteSettingsForm = (settings = {}) => {
  currentSiteSettings = {
    hero_image_url: settings.hero_image_url || "",
    hero_image_position: normalizeHeroPosition(settings.hero_image_position || "50% 50%"),
  };

  heroImageUrl.value = currentSiteSettings.hero_image_url;
  updateHeroPreviewPosition(currentSiteSettings.hero_image_position);
  heroImageFile.value = "";
  renderHeroImagePreview(currentSiteSettings.hero_image_url);
  setStatus(siteSettingsStatus, "");
};

const fillForm = (project) => {
  currentProjectId = project.id;
  slugWasManuallyEdited = true;
  editorTitle.textContent = project.title || "Projekt";
  projectTitle.value = project.title || "";
  projectSlug.value = project.slug || "";
  projectPublished.value = project.is_published ? "true" : "false";
  projectPublishedAt.value = formatDateInput(project.published_at);
  projectSortOrder.value = String(project.sort_order ?? 0);
  projectShortDescription.value = project.short_description || "";
  projectLongDescription.value = project.long_description || "";
  projectThumbnailUrl.value = project.thumbnail_url || "";
  projectImageFile.value = "";
  projectGalleryImageFile.value = "";
  renderImagePreview(project.thumbnail_url || "");
  renderProjectGalleryList();
  setStatus(projectStatus, "");
  persistProjectDraft();
};

const loadProjectImages = async (projectId) => {
  if (!projectId) {
    currentProjectImages = [];
    renderProjectGalleryList();
    return;
  }

  const { data, error } = await supabaseClient
    .from("project_images")
    .select("id, image_url, sort_order, created_at")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    currentProjectImages = [];
    renderProjectGalleryList();
    return;
  }

  currentProjectImages = data || [];
  renderProjectGalleryList();
};

const fillEmployeeForm = (employee) => {
  currentEmployeeId = employee.id;
  employeeEditorTitle.textContent = employee.name || "Medarbetare";
  employeeName.value = employee.name || "";
  employeeRole.value = employee.role || "";
  employeeEmail.value = employee.email || "";
  employeePhone.value = employee.phone || "";
  employeeSortOrder.value = String(employee.sort_order ?? 0);
  employeeActive.value = employee.is_active ? "true" : "false";
  employeeBio.value = employee.bio || "";
  syncEmployeePhotoInputs(employee.photo_url || "");
  employeeImageFile.value = "";
  renderEmployeeImagePreview(employee.photo_url || "");
  setStatus(employeeStatus, "");
  persistEmployeeDraft();
};

const restoreProjectDraft = () => {
  const draft = loadDraft(PROJECT_DRAFT_KEY);
  if (!draft) return false;

  currentProjectId = draft.currentProjectId || null;
  slugWasManuallyEdited = Boolean(draft.slugWasManuallyEdited);
  editorTitle.textContent = draft.editorTitle || "Nytt projekt";
  projectTitle.value = draft.title || "";
  projectSlug.value = draft.slug || "";
  projectPublished.value = draft.published || "true";
  projectPublishedAt.value = draft.publishedAt || getDefaultPublishedAt();
  projectSortOrder.value = draft.sortOrder || "0";
  projectShortDescription.value = draft.shortDescription || "";
  projectLongDescription.value = draft.longDescription || "";
  projectThumbnailUrl.value = draft.thumbnailUrl || "";
  renderImagePreview(projectThumbnailUrl.value);
  persistProjectDraft();
  return true;
};

const restoreEmployeeDraft = () => {
  const draft = loadDraft(EMPLOYEE_DRAFT_KEY);
  if (!draft) return false;

  currentEmployeeId = draft.currentEmployeeId || null;
  employeeEditorTitle.textContent = draft.editorTitle || "Ny medarbetare";
  employeeName.value = draft.name || "";
  employeeRole.value = draft.role || "";
  employeeEmail.value = draft.email || "";
  employeePhone.value = draft.phone || "";
  employeeSortOrder.value = draft.sortOrder || "0";
  employeeActive.value = draft.active || "true";
  employeeBio.value = draft.bio || "";
  syncEmployeePhotoInputs(draft.photoUrl || "");
  renderEmployeeImagePreview(employeePhotoUrl.value);
  return true;
};

const renderProjectList = () => {
  if (!currentProjects.length) {
    projectList.innerHTML = '<div class="project-list-empty">Inga projekt ännu. Skapa ert första projekt.</div>';
    return;
  }

  projectList.innerHTML = "";

  currentProjects.forEach((project) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "project-list-item";
    if (project.id === currentProjectId) {
      item.classList.add("is-active");
    }

    item.innerHTML = `
      <strong>${project.title}</strong>
      <small>${project.is_published ? "Publicerad" : "Ej publicerad"}${project.published_at ? ` • ${new Date(project.published_at).toLocaleDateString("sv-SE")}` : ""}</small>
    `;

    item.addEventListener("click", () => {
      fillForm(project);
      loadProjectImages(project.id);
      renderProjectList();
    });

    projectList.appendChild(item);
  });
};

const renderEmployeeList = () => {
  if (!currentEmployees.length) {
    employeeList.innerHTML = '<div class="project-list-empty">Inga medarbetare ännu. Skapa den första personen.</div>';
    return;
  }

  employeeList.innerHTML = "";

  sortEmployees(currentEmployees).forEach((employee) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "project-list-item";
    if (employee.id === currentEmployeeId) {
      item.classList.add("is-active");
    }

    item.innerHTML = `
      <strong>${employee.name}</strong>
      <small>${employee.role || "Ingen roll"}${employee.is_active ? " • Aktiv" : " • Inaktiv"}</small>
    `;

    item.addEventListener("click", () => {
      fillEmployeeForm(employee);
      renderEmployeeList();
    });

    employeeList.appendChild(item);
  });
};

const loadProjects = async () => {
  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(projectStatus, "Kunde inte ladda projekt.", true);
    return;
  }

  currentProjects = data || [];
  renderProjectList();

  if (currentProjectId) {
    const refreshedProject = currentProjects.find((project) => project.id === currentProjectId);
    if (refreshedProject) {
      fillForm(refreshedProject);
      await loadProjectImages(refreshedProject.id);
    }
  }
};

const loadEmployees = async () => {
  const { data, error } = await supabaseClient
    .from("employees")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    setStatus(employeeStatus, "Kunde inte ladda medarbetare.", true);
    return;
  }

  currentEmployees = sortEmployees(data || []);
  renderEmployeeList();

  if (currentEmployeeId) {
    const refreshedEmployee = currentEmployees.find((employee) => employee.id === currentEmployeeId);
    if (refreshedEmployee) {
      fillEmployeeForm(refreshedEmployee);
    }
  }
};

const loadSiteSettings = async () => {
  const { data, error } = await supabaseClient
    .from("site_settings")
    .select("key, value_text")
    .in("key", ["hero_image_url", "hero_image_position"]);

  if (error) {
    setStatus(siteSettingsStatus, "Kunde inte ladda sajtinställningar.", true);
    fillSiteSettingsForm();
    return;
  }

  const heroSetting = (data || []).find((item) => item.key === "hero_image_url");
  const heroPositionSetting = (data || []).find((item) => item.key === "hero_image_position");
  fillSiteSettingsForm({
    hero_image_url: heroSetting?.value_text || "",
    hero_image_position: heroPositionSetting?.value_text || "50% 50%",
  });
};

const saveSiteSettings = async () => {
  setStatus(siteSettingsStatus, "Sparar...");

  const payload = getSiteSettingsPayload();
  const { error } = await supabaseClient.from("site_settings").upsert([payload.hero_image_url, payload.hero_image_position], {
    onConflict: "key",
  });

  if (error) {
    setStatus(siteSettingsStatus, error.message, true);
    return;
  }

  saveCachedHeroSettings({
    hero_image_url: payload.hero_image_url.value_text || "",
    hero_image_position: payload.hero_image_position.value_text || "50% 50%",
  });
  setStatus(siteSettingsStatus, "Hero-bilden är sparad.");
  await loadSiteSettings();
};

const uploadHeroImage = async () => {
  const file = heroImageFile.files?.[0];
  if (!file) {
    setStatus(siteSettingsStatus, "Välj en bild först.", true);
    return;
  }

  const existingPath = getStoragePathFromPublicUrl(heroImageUrl.value.trim(), "projects");
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
  const safeName = `site/hero-${Date.now()}.${extension}`;

  setStatus(siteSettingsStatus, "Laddar upp hero-bild...");

  if (existingPath && existingPath !== safeName) {
    await supabaseClient.storage.from("projects").remove([existingPath]);
  }

  const { error } = await supabaseClient.storage.from("projects").upload(safeName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    setStatus(siteSettingsStatus, error.message, true);
    return;
  }

  const { data } = supabaseClient.storage.from("projects").getPublicUrl(safeName);
  heroImageUrl.value = data.publicUrl;
  renderHeroImagePreview(data.publicUrl);
  heroImageFile.value = "";
  setStatus(siteSettingsStatus, "Hero-bild uppladdad. Klicka på Spara.");
};

const saveProject = async () => {
  const payload = getProjectPayload();

  if (!payload.title || !payload.slug) {
    setStatus(projectStatus, "Titel och slug måste fyllas i.", true);
    return;
  }

  setStatus(projectStatus, "Sparar...");

  let response;

  if (currentProjectId) {
    response = await supabaseClient
      .from("projects")
      .update(payload)
      .eq("id", currentProjectId)
      .select()
      .single();
  } else {
    response = await supabaseClient
      .from("projects")
      .insert(payload)
      .select()
      .single();
  }

  if (response.error) {
    setStatus(projectStatus, response.error.message, true);
    return;
  }

  currentProjectId = response.data.id;
  setStatus(projectStatus, "Projekt sparat.");
  clearDraft(PROJECT_DRAFT_KEY);
  await loadProjects();
  fillForm(response.data);
  await loadProjectImages(response.data.id);
};

const deleteProject = async () => {
  if (!currentProjectId) {
    setStatus(projectStatus, "Välj ett projekt att ta bort.", true);
    return;
  }

  const confirmed = window.confirm("Vill du verkligen ta bort projektet?");
  if (!confirmed) return;

  const { error } = await supabaseClient.from("projects").delete().eq("id", currentProjectId);

  if (error) {
    setStatus(projectStatus, error.message, true);
    return;
  }

  resetForm();
  clearDraft(PROJECT_DRAFT_KEY);
  await loadProjects();
  setStatus(projectStatus, "Projekt borttaget.");
};

const uploadProjectImage = async () => {
  const file = projectImageFile.files?.[0];
  if (!file) {
    setStatus(projectStatus, "Välj en bild först.", true);
    return;
  }

  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  setStatus(projectStatus, "Laddar upp bild...");

  const { error } = await supabaseClient.storage.from("projects").upload(safeName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    setStatus(projectStatus, error.message, true);
    return;
  }

  const { data } = supabaseClient.storage.from("projects").getPublicUrl(safeName);
  projectThumbnailUrl.value = data.publicUrl;
  renderImagePreview(data.publicUrl);
  setStatus(projectStatus, "Bild uppladdad.");
  persistProjectDraft();
};

const uploadProjectGalleryImage = async () => {
  if (!currentProjectId) {
    setStatus(projectStatus, "Spara projektet först innan du laddar upp fler bilder.", true);
    return;
  }

  const file = projectGalleryImageFile.files?.[0];
  if (!file) {
    setStatus(projectStatus, "Välj en bild först.", true);
    return;
  }

  const safeName = `project-galleries/${currentProjectId}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  setStatus(projectStatus, "Laddar upp galleribild...");

  const { error: uploadError } = await supabaseClient.storage.from("projects").upload(safeName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    setStatus(projectStatus, uploadError.message, true);
    return;
  }

  const { data: publicUrlData } = supabaseClient.storage.from("projects").getPublicUrl(safeName);
  const { error: insertError } = await supabaseClient
    .from("project_images")
    .insert({
      project_id: currentProjectId,
      image_url: publicUrlData.publicUrl,
      sort_order: currentProjectImages.length,
    });

  if (insertError) {
    setStatus(projectStatus, insertError.message, true);
    return;
  }

  projectGalleryImageFile.value = "";
  setStatus(projectStatus, "Galleribild uppladdad.");
  await loadProjectImages(currentProjectId);
};

const deleteProjectGalleryImage = async (imageId) => {
  const confirmed = window.confirm("Vill du ta bort den här projektbilden?");
  if (!confirmed) return;

  const { error } = await supabaseClient.from("project_images").delete().eq("id", imageId);

  if (error) {
    setStatus(projectStatus, error.message, true);
    return;
  }

  setStatus(projectStatus, "Projektbild borttagen.");
  await loadProjectImages(currentProjectId);
};

const saveEmployee = async () => {
  const payload = getEmployeePayload();

  if (!payload.name) {
    setStatus(employeeStatus, "Namn måste fyllas i.", true);
    return;
  }

  setStatus(employeeStatus, "Sparar...");

  let response;

  if (currentEmployeeId) {
    response = await supabaseClient
      .from("employees")
      .update(payload)
      .eq("id", currentEmployeeId)
      .select()
      .single();
  } else {
    response = await supabaseClient
      .from("employees")
      .insert(payload)
      .select()
      .single();
  }

  if (response.error) {
    setStatus(employeeStatus, response.error.message, true);
    return;
  }

  currentEmployeeId = response.data.id;
  setStatus(employeeStatus, "Medarbetare sparad.");
  clearDraft(EMPLOYEE_DRAFT_KEY);
  await loadEmployees();
  fillEmployeeForm(response.data);
};

const deleteEmployee = async () => {
  if (!currentEmployeeId) {
    setStatus(employeeStatus, "Välj en medarbetare att ta bort.", true);
    return;
  }

  const confirmed = window.confirm("Vill du verkligen ta bort medarbetaren?");
  if (!confirmed) return;

  const { error } = await supabaseClient.from("employees").delete().eq("id", currentEmployeeId);

  if (error) {
    setStatus(employeeStatus, error.message, true);
    return;
  }

  resetEmployeeForm();
  clearDraft(EMPLOYEE_DRAFT_KEY);
  await loadEmployees();
  setStatus(employeeStatus, "Medarbetare borttagen.");
};

const uploadEmployeeImage = async () => {
  const file = employeeImageFile.files?.[0];
  if (!file) {
    setStatus(employeeStatus, "Välj en bild först.", true);
    return;
  }

  const existingPath = getStoragePathFromPublicUrl(employeePhotoUrl.value.trim(), "employees");
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "jpg";
  const safeBaseName = employeeName.value.trim()
    ? slugify(employeeName.value.trim())
    : currentEmployeeId || `employee-${Date.now()}`;
  const safeName = `employees/${safeBaseName}-${Date.now()}.${extension}`;

  setStatus(employeeStatus, "Laddar upp bild...");

  const { error } = await supabaseClient.storage.from("employees").upload(safeName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    setStatus(employeeStatus, error.message, true);
    return;
  }

  const { data } = supabaseClient.storage.from("employees").getPublicUrl(safeName);
  syncEmployeePhotoInputs(data.publicUrl);
  renderEmployeeImagePreview(data.publicUrl);
  employeeImageFile.value = "";

  if (currentEmployeeId) {
    const { error: updateError } = await supabaseClient
      .from("employees")
      .update({ photo_url: data.publicUrl })
      .eq("id", currentEmployeeId);

    if (updateError) {
      setStatus(employeeStatus, updateError.message, true);
      return;
    }

    if (existingPath && existingPath !== safeName) {
      await supabaseClient.storage.from("employees").remove([existingPath]);
    }

    await loadEmployees();
    const refreshedEmployee = currentEmployees.find((employee) => employee.id === currentEmployeeId);
    if (refreshedEmployee) {
      fillEmployeeForm(refreshedEmployee);
    }
    setStatus(employeeStatus, "Bild uppladdad och sparad.");
    return;
  }

  setStatus(employeeStatus, "Bild uppladdad. Spara medarbetaren för att publicera den.");
  persistEmployeeDraft();
};

const handleAuthChange = async (session) => {
  const isLoggedIn = Boolean(session);
  authCard.hidden = isLoggedIn;
  adminApp.hidden = !isLoggedIn;
  signOutButton.hidden = !isLoggedIn;

  if (isLoggedIn) {
    await loadSiteSettings();
    await loadProjects();
    await loadEmployees();
    if (!restoreProjectDraft()) {
      resetForm();
    } else if (currentProjectId) {
      await loadProjectImages(currentProjectId);
    }
    if (!restoreEmployeeDraft()) resetEmployeeForm();
  }
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(authStatus, "Loggar in...");

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setStatus(authStatus, error.message, true);
    return;
  }

  setStatus(authStatus, "");
});

signOutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  resetForm();
  resetEmployeeForm();
  currentProjects = [];
  currentProjectImages = [];
  currentEmployees = [];
  projectList.innerHTML = "";
  renderProjectGalleryList();
  employeeList.innerHTML = "";
});

newProjectButton.addEventListener("click", () => {
  clearDraft(PROJECT_DRAFT_KEY);
  resetForm();
  renderProjectList();
});

saveProjectButton.addEventListener("click", saveProject);
deleteProjectButton.addEventListener("click", deleteProject);
uploadImageButton.addEventListener("click", uploadProjectImage);
uploadProjectGalleryImageButton.addEventListener("click", uploadProjectGalleryImage);
saveEmployeeButton.addEventListener("click", saveEmployee);
deleteEmployeeButton.addEventListener("click", deleteEmployee);
uploadEmployeeImageButton.addEventListener("click", uploadEmployeeImage);
saveSiteSettingsButton.addEventListener("click", saveSiteSettings);
uploadHeroImageButton.addEventListener("click", uploadHeroImage);

heroImagePreview?.addEventListener("pointerdown", (event) => {
  if (!heroImageUrl.value.trim()) return;
  isDraggingHeroPreview = true;
  heroImagePreview.classList.add("is-dragging");
  heroImagePreview.setPointerCapture?.(event.pointerId);
  setHeroPositionFromPointer(event.clientX, event.clientY);
});

heroImagePreview?.addEventListener("pointermove", (event) => {
  if (!isDraggingHeroPreview) return;
  setHeroPositionFromPointer(event.clientX, event.clientY);
});

const stopHeroPreviewDrag = (event) => {
  if (!isDraggingHeroPreview) return;
  isDraggingHeroPreview = false;
  heroImagePreview?.classList.remove("is-dragging");
  if (event?.pointerId !== undefined) {
    heroImagePreview?.releasePointerCapture?.(event.pointerId);
  }
};

heroImagePreview?.addEventListener("pointerup", stopHeroPreviewDrag);
heroImagePreview?.addEventListener("pointercancel", stopHeroPreviewDrag);
heroImagePreview?.addEventListener("lostpointercapture", stopHeroPreviewDrag);

heroImagePreview?.addEventListener("keydown", (event) => {
  if (!heroImageUrl.value.trim()) return;

  const { x, y } = parseHeroPosition(heroImagePosition.value || "50% 50%");
  let xValue = Number.parseFloat(x) || 50;
  let yValue = Number.parseFloat(y) || 50;
  const step = event.shiftKey ? 10 : 2;

  if (event.key === "ArrowLeft") xValue -= step;
  else if (event.key === "ArrowRight") xValue += step;
  else if (event.key === "ArrowUp") yValue -= step;
  else if (event.key === "ArrowDown") yValue += step;
  else return;

  event.preventDefault();
  xValue = Math.min(Math.max(xValue, 0), 100);
  yValue = Math.min(Math.max(yValue, 0), 100);
  updateHeroPreviewPosition(`${xValue}% ${yValue}%`);
});

projectTitle.addEventListener("input", () => {
  if (!slugWasManuallyEdited) {
    projectSlug.value = slugify(projectTitle.value);
  }
  persistProjectDraft();
});

projectSlug.addEventListener("input", () => {
  slugWasManuallyEdited = true;
  persistProjectDraft();
});

projectThumbnailUrl.addEventListener("input", () => {
  renderImagePreview(projectThumbnailUrl.value.trim());
  persistProjectDraft();
});

employeePhotoUrl.addEventListener("input", () => {
  syncEmployeePhotoInputs(employeePhotoUrl.value.trim());
  renderEmployeeImagePreview(employeePhotoUrl.value.trim());
  persistEmployeeDraft();
});

employeePhotoUrlSecondary.addEventListener("input", () => {
  syncEmployeePhotoInputs(employeePhotoUrlSecondary.value.trim());
  renderEmployeeImagePreview(employeePhotoUrlSecondary.value.trim());
  persistEmployeeDraft();
});

newEmployeeButton.addEventListener("click", () => {
  clearDraft(EMPLOYEE_DRAFT_KEY);
  resetEmployeeForm();
  renderEmployeeList();
});

[
  projectPublished,
  projectPublishedAt,
  projectShortDescription,
  projectLongDescription,
].forEach((element) => {
  element?.addEventListener("input", persistProjectDraft);
  element?.addEventListener("change", persistProjectDraft);
});

[
  employeeName,
  employeeRole,
  employeeEmail,
  employeePhone,
  employeeActive,
  employeeBio,
].forEach((element) => {
  element?.addEventListener("input", persistEmployeeDraft);
  element?.addEventListener("change", persistEmployeeDraft);
});

supabaseClient.auth.onAuthStateChange((_event, session) => {
  handleAuthChange(session);
});

const initialize = async () => {
  renderImagePreview("");
  renderHeroImagePreview("");
  renderProjectGalleryList();
  renderEmployeeImagePreview("");
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  await handleAuthChange(session);
};

initialize();
