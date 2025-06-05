/**
 * Sistema de carga de componentes HTML
 * Este archivo maneja la carga dinámica de componentes HTML en el frontend
 */

// Función para cargar componentes HTML
async function loadComponent(url, targetId) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error cargando componente: ${response.status}`);
    }
    const html = await response.text();
    document.getElementById(targetId).innerHTML = html;
    return true;
  } catch (error) {
    console.error("Error al cargar componente:", error);
    return false;
  }
}

// Función para cargar múltiples componentes
async function loadComponents(components) {
  const promises = components.map((component) =>
    loadComponent(component.url, component.targetId)
  );

  return Promise.all(promises);
}

// Función para cargar una vista
async function loadView(viewName) {
  // Ocultar todas las vistas
  document.querySelectorAll(".section-content").forEach((section) => {
    section.classList.add("hidden");
  });

  const viewElement = document.getElementById(`${viewName}-section`);
  if (!viewElement) {
    console.error(`Vista no encontrada: ${viewName}`);
    return false;
  }

  // Si la vista aún no se ha cargado
  if (!viewElement.hasAttribute("data-loaded")) {
    try {
      await loadComponent(`views/${viewName}.html`, `${viewName}-section`);
      viewElement.setAttribute("data-loaded", "true");
    } catch (error) {
      console.error(`Error al cargar la vista ${viewName}:`, error);
      return false;
    }
  }

  // Mostrar la vista actual
  viewElement.classList.remove("hidden");

  // Actualizar menú activo
  updateActiveMenuItem(viewName);

  return true;
}

// Función para actualizar ítem activo en el menú
function updateActiveMenuItem(viewName) {
  // Quitar la clase 'active' de todos los ítems del menú
  document.querySelectorAll(".menu li").forEach((item) => {
    item.classList.remove("active");
  });

  // Añadir la clase 'active' al ítem correspondiente a la vista actual
  const activeItem = document.querySelector(
    `.menu li[data-section="${viewName}"]`
  );
  if (activeItem) {
    activeItem.classList.add("active");
  }
}

// Inicializa los componentes principales
async function initializeUI() {
  // Cargar componentes iniciales (layout)
  await loadComponents([
    { url: "components/layout/sidebar.html", targetId: "sidebar-container" },
    { url: "components/layout/header.html", targetId: "header-container" },
  ]);

  // Cargar componentes compartidos
  await loadComponents([
    {
      url: "components/shared/notification-dropdown.html",
      targetId: "notifications-dropdown-container",
    },
    { url: "components/shared/toast.html", targetId: "toast-container" },
  ]);

  // Cargar modales
  await loadComponents([
    {
      url: "components/modals/client-modal.html",
      targetId: "client-modal-container",
    },
    {
      url: "components/modals/contracted-service-modal.html",
      targetId: "contracted-service-modal-container",
    },
    {
      url: "components/modals/service-modal.html",
      targetId: "service-modal-container",
    },
    {
      url: "components/modals/invoice-modal.html",
      targetId: "invoice-modal-container",
    },
    {
      url: "components/modals/partial-payment-modal.html",
      targetId: "partial-payment-modal-container",
    },
    {
      url: "components/modals/confirm-modal.html",
      targetId: "confirm-modal-container",
    },
    {
      url: "components/modals/event-modal.html",
      targetId: "event-modal-container",
    },
  ]);

  // Inicializar eventos después de cargar componentes
  initUIEventListeners();
}

// Inicializar eventos de navegación
function initUIEventListeners() {
  // Event listeners para el menú lateral
  document.querySelectorAll(".menu li").forEach((item) => {
    item.addEventListener("click", () => {
      const sectionName = item.getAttribute("data-section");
      loadView(sectionName);
    });
  });
}
