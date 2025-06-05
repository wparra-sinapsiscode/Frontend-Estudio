// Variables globales
let currentSection = "dashboard";
let currentClientPage = 1;
let currentContractedServicePage = 1;
let currentInvoicePage = 1;
let itemsPerPage = 10;
let filteredClients = [];
let filteredContractedServices = [];
let filteredInvoices = [];
let currentUser = null;
let currentDate = new Date(); // Usar la fecha actual real en lugar de una simulada
let currentCalendarMonth = currentDate.getMonth();
let currentCalendarYear = currentDate.getFullYear();
let calendarEvents = [];
let serviceRevenues = [];

// Configuración API
const API_BASE_URL = "http://localhost:5000/api";

// Declaración anticipada de funciones y variables que se utilizan antes de ser definidas

// Funciones principales de carga de datos
let loadNotifications;
let loadInvoicesData;
let loadDashboardData;
let loadCalendarData;

// Funciones de UI y navegación
let closeModal;
let showModal;
let openModal;
let showToast;

// Manejadores de eventos y formularios
let updateInvoiceServices;
let handleDocumentUpload;
let handleVoucherUpload;
let handleInvoiceSubmit;
let handlePartialPaymentSubmit;
let handleClientSubmit;
let handleContractedServiceSubmit;
let handleContractedServiceSubmitAPI;
let handleServiceSubmit;
let handleLogin;
let handleLogout;
let handleGlobalSearch;

// Funciones para abrir modales
let openConfirmModal;
let openClientModal;
let openServiceModal;
let openInvoiceModal;
let openContractedServiceModal;
let openPartialPaymentModal;
let viewInvoice;
let confirmDeleteInvoice;
let loadInvoiceClientOptions;

// Funciones para exportación y filtrado
let exportInvoicesToExcel;
let exportClientsToExcel;
let exportServicesToExcel;
let exportContractedServicesToExcel;
let exportCalendarToExcel;
let applyClientFilters;
let applyInvoiceFilters;
let applyContractedServiceFilters;
let applyContractedServiceFiltersAPI;

// Funciones de calendario
let changeCalendarMonth;
let sendInvoiceByWhatsApp;
let showEventDetails;
let showDayDetails;
let updateCalendarHeader;
let prepareCalendarEvents;
let prepareCalendarEventsManually;
let renderCalendar;

// Funciones de paginación y renderizado
let updateInvoicePagination;
let updateClientPagination;
let updateContractedServicePagination;
let renderInvoicesTable;
let renderClientsTable;
let renderContractedServicesTable;
let setupInvoicePaginationControls;
let setupClientPaginationControls;
let setupContractedServicePaginationControls;

// Funciones de carga de datos específicas
let loadClientsData;
let loadContractedServicesData;
let loadServicesData;

// Implementación inicial de showToast (ya declarada arriba)
showToast = function(type, title, message = "", duration = 3000) {
  // Implementación simple para mostrar una alerta si se llama antes de que el componente esté cargado
  console.log(`[${type}] ${title}${message ? ': ' + message : ''}`);
};

// Implementaciones de funciones de paginación (definidas aquí para estar disponibles antes de su uso)
updateInvoicePagination = function() {
  // Similar to updateClientPagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginationContainer = document.getElementById("invoices-pagination");
  if (!paginationContainer) return;

  if (!paginationContainer.hasAttribute("data-pagination-loaded")) {
    loadComponent(
      "components/shared/pagination.html",
      "invoices-pagination"
    ).then(() => {
      paginationContainer.setAttribute("data-pagination-loaded", "true");
      setupInvoicePaginationControls(totalPages, paginationContainer);
    });
  } else {
    setupInvoicePaginationControls(totalPages, paginationContainer);
  }
};

setupInvoicePaginationControls = function(totalPages, paginationContainer) {
  const paginationNumbers = paginationContainer.querySelector(
    ".pagination-numbers"
  );
  if (!paginationNumbers) return;
  paginationNumbers.innerHTML = "";

  if (currentInvoicePage > totalPages && totalPages > 0)
    currentInvoicePage = totalPages;
  else if (totalPages === 0) currentInvoicePage = 1;

  let startPage = Math.max(1, currentInvoicePage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `pagination-number ${
      i === currentInvoicePage ? "active" : ""
    }`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      currentInvoicePage = i;
      renderInvoicesTable();
      updateInvoicePagination();
    };
    paginationNumbers.appendChild(pageBtn);
  }
  
  const prevBtn = paginationContainer.querySelector(
    '.pagination-btn[data-page="prev"]'
  );
  const nextBtn = paginationContainer.querySelector(
    '.pagination-btn[data-page="next"]'
  );
  
  if (prevBtn) {
    prevBtn.disabled = currentInvoicePage === 1;
    prevBtn.onclick = () => {
      if (currentInvoicePage > 1) {
        currentInvoicePage--;
        renderInvoicesTable();
        updateInvoicePagination();
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentInvoicePage === totalPages || totalPages === 0;
    nextBtn.onclick = () => {
      if (currentInvoicePage < totalPages) {
        currentInvoicePage++;
        renderInvoicesTable();
        updateInvoicePagination();
      }
    };
  }
};

renderInvoicesTable = function() {
  const tableBody = document.querySelector("#invoices-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  const startIndex = (currentInvoicePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  if (paginatedInvoices.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="11" class="text-center">No se encontraron proformas.</td></tr>`;
    return;
  }
  paginatedInvoices.forEach((invoice) => {
    // Debug: Verificar datos de la factura
    console.log('Procesando factura para tabla:', invoice);
    console.log('Pagos recibidos para esta factura:', invoice.payments);
    
    const row = document.createElement("tr");
    // Los datos del cliente y servicio vienen incluidos desde la API
    const client = invoice.client || invoice.Client;
    const service = invoice.service || invoice.Service;
    const clientName = client ? client.name : "Cliente desconocido";
    const serviceName = service ? service.name : "Servicio desconocido";
    
    // Validar y formatear montos
    const amount = parseFloat(invoice.amount) || 0;
    
    // Calcular monto pagado desde el array de payments
    let paidAmount = 0;
    if (invoice.payments && Array.isArray(invoice.payments)) {
      invoice.payments.forEach(payment => {
        paidAmount += parseFloat(payment.amount) || 0;
      });
    }
    
    const pendingAmount = amount - paidAmount;
    
    // Debug: Mostrar cálculos
    console.log('Monto Total Factura:', amount, 'Monto Pagado Calculado:', paidAmount, 'Monto Pendiente Calculado:', pendingAmount);

    let statusClass = "";
    if (invoice.status === "pagada") statusClass = "status-active";
    else if (invoice.status === "pendiente") statusClass = "status-pending";
    else if (invoice.status === "vencida") statusClass = "status-alert";
    const documentInfo = invoice.document
      ? `<span class="document-item"><i class="fas fa-file-alt"></i> ${invoice.document.name}</span>`
      : '<span class="text-muted">Sin documento</span>';

    row.innerHTML = `<td>${
      invoice.number
    }</td><td>${clientName}</td><td>${serviceName}</td><td>${new Date(
      invoice.issueDate
    ).toLocaleDateString()}</td><td>${new Date(
      invoice.dueDate
    ).toLocaleDateString()}</td><td>S/. ${amount.toFixed(
      2
    )}</td><td>S/. ${paidAmount.toFixed(2)}</td><td>S/. ${pendingAmount.toFixed(
      2
    )}</td><td>${documentInfo}</td><td><span class="status-badge ${statusClass}">${capitalizeFirstLetter(
      invoice.status
    )}</span></td><td><div class="table-actions"><div class="action-btn view-btn" data-action="view" data-invoice-id="${
      invoice.id
    }"><i class="fas fa-eye"></i></div><div class="action-btn edit-btn" data-action="edit" data-invoice-id="${
      invoice.id
    }"><i class="fas fa-edit"></i></div><div class="action-btn delete-btn" data-action="delete" data-invoice-id="${
      invoice.id
    }"><i class="fas fa-trash"></i></div><div class="action-btn payment-btn" data-action="payment" data-invoice-id="${
      invoice.id
    }"><i class="fas fa-money-bill-wave"></i></div>${
      invoice.document
        ? `<div class="action-btn download-btn" data-action="download" data-invoice-id="${invoice.id}"><i class="fas fa-download"></i></div>`
        : ""
    }<div class="action-btn whatsapp-btn" data-action="whatsapp" data-invoice-id="${
      invoice.id
    }"><i class="fab fa-whatsapp"></i></div></div></td>`;
    tableBody.appendChild(row);
  });
};

// Implementaciones de funciones de calendario (ya declaradas al inicio del archivo)
updateCalendarHeader = function() {
  console.log('🔍 DEBUG: Ejecutando updateCalendarHeader...');
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const calendarHeader = document.getElementById("current-month-year");
  console.log('🔍 DEBUG: Elemento current-month-year encontrado:', calendarHeader);
  if (calendarHeader) {
    calendarHeader.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    console.log('🔍 DEBUG: Header actualizado con:', `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`);
  } else {
    console.log('🚨 DEBUG: ERROR - No se encontró el elemento current-month-year');
  }
};

prepareCalendarEvents = async function() {
  console.log('🔍 DEBUG: Ejecutando prepareCalendarEvents...');
  console.log('🔍 DEBUG: Mes/Año actual:', currentCalendarMonth + 1, currentCalendarYear);
  try {
    calendarEvents = [];

    // Crear endpoint de calendario que devuelva todos los eventos para el mes/año actual
    const calendarData = await fetchWithAuth(
      `${API_BASE_URL}/calendar/events?month=${
        currentCalendarMonth + 1
      }&year=${currentCalendarYear}`
    );

    console.log('🔍 DEBUG: Respuesta de la API calendar/events:', calendarData);

    // Verificar si la respuesta tiene la estructura esperada
    const events = calendarData && calendarData.data ? calendarData.data : (Array.isArray(calendarData) ? calendarData : []);
    console.log('🔍 DEBUG: Array de eventos extraído:', events);

    if (events && events.length > 0) {
      // Mapear la respuesta de la API al formato de eventos del calendario
      events.forEach((event) => {
        const eventDate = new Date(event.date);
        calendarEvents.push({
          date: eventDate,
          title: event.title,
          description: event.description,
          type: event.type,
          invoiceId: event.invoiceId,
          clientId: event.clientId,
        });
      });
      console.log('🔍 DEBUG: Eventos procesados desde API:', calendarEvents);
    } else {
      console.log('🔍 DEBUG: No se recibieron eventos de la API, intentando preparación manual...');
    }
  } catch (error) {
    console.error("🚨 DEBUG: Error preparando eventos del calendario:", error);
    console.log('🔍 DEBUG: Ejecutando fallback - preparación manual...');
    // Fallback a preparación manual si la API falla
    await prepareCalendarEventsManually();
  }
  console.log('🔍 DEBUG: Eventos finales del calendario:', calendarEvents);
};

prepareCalendarEventsManually = async function() {
  console.log('🔍 DEBUG: Ejecutando prepareCalendarEventsManually (fallback)...');
  try {
    calendarEvents = [];

    // Cargar servicios contratados con próximos pagos
    const contractedServicesResponse = await fetchWithAuth(
      `${API_BASE_URL}/contracted-services`
    );
    console.log('🔍 DEBUG: Respuesta de contracted-services:', contractedServicesResponse);
    if (
      contractedServicesResponse &&
      contractedServicesResponse.success &&
      Array.isArray(contractedServicesResponse.data)
    ) {
      contractedServicesResponse.data.forEach((cs) => {
        if (cs.nextPayment) {
          const client = cs.Client || cs.client;
          const service = cs.Service || cs.service;
          if (client && service) {
            calendarEvents.push({
              date: new Date(cs.nextPayment),
              title: `Pago: ${client.name}`,
              description: `Servicio: ${service.name}`,
              type: "payment",
              clientId: cs.clientId,
              serviceId: cs.serviceId,
            });
          }
        }
      });
    }

    // Cargar facturas pendientes con fechas de vencimiento
    const invoicesResponse = await fetchWithAuth(
      `${API_BASE_URL}/invoices?status=pendiente`
    );
    if (invoicesResponse && Array.isArray(invoicesResponse)) {
      invoicesResponse.forEach((invoice) => {
        if (invoice.dueDate) {
          const client = invoice.Client || invoice.client;
          const service = invoice.Service || invoice.service;
          if (client && service) {
            calendarEvents.push({
              date: new Date(invoice.dueDate),
              title: `Vencimiento: ${invoice.number}`,
              description: `Cliente: ${client.name} - ${service.name}`,
              type: "invoice",
              invoiceId: invoice.id,
              clientId: invoice.clientId,
            });
          }
        }
      });
    }
  } catch (error) {
    console.error("Error preparando eventos manualmente:", error);
  }
};

renderCalendar = function() {
  console.log('🔍 DEBUG: Ejecutando renderCalendar...');
  const calendarGrid = document.getElementById("calendar-days");
  console.log('🔍 DEBUG: Contenedor calendar-days encontrado:', calendarGrid);
  
  if (!calendarGrid) {
    console.log('🚨 DEBUG: ERROR - No se encontró el elemento calendar-days');
    return;
  }

  console.log('🔍 DEBUG: Limpiando contenido previo del calendario...');
  calendarGrid.innerHTML = "";
  console.log('🔍 DEBUG: Headers de días ya están en el HTML estático, solo agregando días...');

  // Obtener el primer día del mes y cuántos días tiene
  const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
  const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  
  console.log('🔍 DEBUG: Información del mes:');
  console.log('  - Primer día:', firstDay);
  console.log('  - Último día:', lastDay);
  console.log('  - Días en el mes:', daysInMonth);
  console.log('  - Día de inicio (0=domingo):', startDay);
  console.log('  - Eventos disponibles:', calendarEvents);

  // Crear celdas vacías para los días antes del primer día del mes
  console.log('🔍 DEBUG: Creando', startDay, 'celdas vacías...');
  for (let i = 0; i < startDay; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "calendar-day empty";
    calendarGrid.appendChild(emptyDay);
  }

  // Crear celdas para cada día del mes
  console.log('🔍 DEBUG: Creando celdas para', daysInMonth, 'días...');
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day";
    
    // Crear el número del día con la estructura correcta
    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // Crear el contenedor de eventos
    const dayEventsContainer = document.createElement("div");
    dayEventsContainer.className = "day-events";
    dayElement.appendChild(dayEventsContainer);
    
    console.log(`🔍 DEBUG: Creando día ${day} - elemento:`, dayElement);
    console.log(`🔍 DEBUG: Día ${day} - estructura HTML:`, dayElement.innerHTML);

    const currentDate = new Date(currentCalendarYear, currentCalendarMonth, day);
    const dayEvents = calendarEvents.filter(
      (event) => event.date.toDateString() === currentDate.toDateString()
    );

    if (dayEvents.length > 0) {
      dayElement.classList.add("has-events");
      
      // Crear el contador de eventos
      const eventCount = document.createElement("div");
      eventCount.className = "event-count";
      eventCount.textContent = dayEvents.length;
      dayElement.appendChild(eventCount);
      
      // Crear elementos de evento individuales
      dayEvents.forEach((event, index) => {
        const eventElement = document.createElement("div");
        eventElement.className = "day-event";
        eventElement.textContent = event.title || `Evento ${index + 1}`;
        
        // Agregar clase de color según el tipo de evento
        if (event.type === 'payment') eventElement.classList.add('event-payment');
        else if (event.type === 'paid') eventElement.classList.add('event-paid');
        else if (event.type === 'warning') eventElement.classList.add('event-warning');
        else if (event.type === 'danger') eventElement.classList.add('event-danger');
        
        dayEventsContainer.appendChild(eventElement);
      });
      
      console.log(`🔍 DEBUG: Día ${day} tiene ${dayEvents.length} eventos - eventCount elemento:`, eventCount);
      console.log(`🔍 DEBUG: Día ${day} - innerHTML después de agregar eventos:`, dayElement.innerHTML);
    }

    dayElement.addEventListener("click", () => {
      if (dayEvents.length > 0) {
        showDayDetails(currentDate);
      }
    });

    calendarGrid.appendChild(dayElement);
    console.log(`🔍 DEBUG: Día ${day} añadido al calendario - posición en DOM:`, calendarGrid.children.length);
  }
  
  console.log('🔍 DEBUG: Calendario renderizado. Total de elementos hijos en calendar-days:', calendarGrid.children.length);
};

loadCalendarData = async function() {
  console.log('🔍 DEBUG: Ejecutando loadCalendarData...');
  
  // Evitar ejecuciones múltiples simultáneas
  if (loadCalendarData.isLoading) {
    console.log('🔍 DEBUG: loadCalendarData ya está en ejecución, saltando...');
    return;
  }
  
  loadCalendarData.isLoading = true;
  
  try {
    updateCalendarHeader();
    await prepareCalendarEvents();
    renderCalendar();
  } finally {
    loadCalendarData.isLoading = false;
  }
};

// Función para marcar todas las notificaciones como leídas
// Implementación de markAllNotificationsAsRead (ya declarada anteriormente en el código)
markAllNotificationsAsRead = async function() {
  try {
    await fetchWithAuth(`${API_BASE_URL}/notifications/mark-all-read`, "PUT");
    if (typeof loadNotifications === 'function') {
      await loadNotifications();
    }
    showToast(
      "success",
      "Notificaciones",
      "Todas las notificaciones marcadas como leídas"
    );
  } catch (error) {
    console.error(
      "Error marcando todas las notificaciones como leídas:",
      error
    );
    showToast(
      "error",
      "Error",
      "No se pudieron marcar todas las notificaciones como leídas"
    );
  }
}

// Funciones de Facturas y Pagos (definidas aquí para evitar errores de referencia)

// Función para manejar el envío de una factura por WhatsApp
// Implementación de sendInvoiceByWhatsApp (ya declarada al inicio del archivo)
sendInvoiceByWhatsApp = async function(invoiceId) {
  try {
    console.log('🔍 DEBUG sendInvoiceByWhatsApp - Iniciando con invoiceId:', invoiceId, 'tipo:', typeof invoiceId);
    let invoice;

    // Convertir invoiceId a número si viene como string
    const id = parseInt(invoiceId);
    console.log('🔍 DEBUG sendInvoiceByWhatsApp - ID parseado:', id, 'isNaN:', isNaN(id));
    
    if (id && !isNaN(id)) {
      console.log('🔍 DEBUG sendInvoiceByWhatsApp - Cargando factura desde API...');
      // Cargar factura desde API con datos relacionados
      const response = await fetchWithAuth(
        `${API_BASE_URL}/invoices/${id}?include=client,service,payments`
      );
      console.log('🔍 DEBUG sendInvoiceByWhatsApp - Respuesta API:', response);
      invoice = response.data || response;
    } else {
      const modalId = document.getElementById("invoice-id")?.value; // From modal
      if (modalId) {
        invoice = await fetchWithAuth(
          `${API_BASE_URL}/invoices/${modalId}`
        );
      } else {
        // Nueva factura desde modal
        const clientId = parseInt(
          document.getElementById("invoice-client")?.value
        );
        const client = await fetchWithAuth(
          `${API_BASE_URL}/clients/${clientId}`
        );
        invoice = {
          clientId: clientId,
          amount: document.getElementById("invoice-amount")?.value,
          number: document.getElementById("invoice-number")?.value,
          document:
            document.getElementById("invoice-document")?.files?.length > 0
              ? {
                  name: document.getElementById("invoice-document").files[0]
                    .name,
                }
              : null,
          paidAmount: 0,
          Client: client,
          client: client,
        };
      }
    }

    if (!invoice) {
      console.log('🔍 DEBUG sendInvoiceByWhatsApp - No se pudo obtener información de la proforma');
      showToast(
        "error",
        "Error",
        "No se pudo obtener información de la proforma"
      );
      return;
    }

    console.log('🔍 DEBUG sendInvoiceByWhatsApp - Datos completos de la factura:', invoice);
    let client = invoice.Client || invoice.client;
    console.log('🔍 DEBUG sendInvoiceByWhatsApp - Cliente extraído:', client);
    
    // Si no hay client, cargarlo por separado
    if (!client && invoice.clientId) {
      console.log('🔍 DEBUG sendInvoiceByWhatsApp - Cargando cliente por separado...');
      try {
        const clientResponse = await fetchWithAuth(`${API_BASE_URL}/clients/${invoice.clientId}`);
        client = clientResponse.data || clientResponse;
        console.log('🔍 DEBUG sendInvoiceByWhatsApp - Cliente cargado por separado:', client);
      } catch (error) {
        console.error('Error cargando cliente:', error);
      }
    }
    
    if (!client) {
      console.log('🔍 DEBUG sendInvoiceByWhatsApp - No se encontró información del cliente, usando fallback');
      showToast(
        "warning", 
        "Cliente no encontrado",
        "No se pudo cargar la información del cliente. No se puede enviar por WhatsApp."
      );
      return;
    }

    const clientPhone = client.phone || client.whatsapp;
    if (!clientPhone) {
      showToast(
        "warning",
        "Advertencia",
        "El cliente no tiene un número de teléfono registrado"
      );
      return;
    }

    // Formatear monto pendiente con símbolo de sol
    const pendingAmount = 
      (invoice.amount - (invoice.paidAmount || 0)).toFixed(2);
    const formattedAmount = `S/. ${pendingAmount}`;

    // Construir mensaje de WhatsApp
    let message = `Hola ${client.name}, `;
    message += `le enviamos la proforma ${invoice.number} por un monto de ${formattedAmount}. `;
    
    if (invoice.document) {
      message += `Adjuntamos el documento en el siguiente enlace: [Documento de Proforma]. `;
    }
    
    message += `Gracias por confiar en nuestros servicios.`;

    // Codificar mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Formatear número para WhatsApp (eliminar espacios, paréntesis, guiones)
    const formattedPhone = clientPhone.replace(/[\s()\-]/g, "");
    
    // Abrir WhatsApp Web en nueva pestaña
    window.open(
      `https://wa.me/${formattedPhone}?text=${encodedMessage}`,
      "_blank"
    );

    showToast(
      "success",
      "WhatsApp",
      "Redirigiendo a WhatsApp"
    );
  } catch (error) {
    console.error("Error enviando factura por WhatsApp:", error);
    showToast(
      "error",
      "Error",
      "No se pudo enviar la factura por WhatsApp"
    );
  }
}

// Implementación temprana de viewInvoice para disponibilidad en tabla
viewInvoice = async function(invoiceId) {
  try {
    console.log('🔍 DEBUG viewInvoice - Iniciando con invoiceId:', invoiceId);
    
    // Mostrar indicador de carga
    const eventTitleEl = document.getElementById("event-title");
    const eventDetailsEl = document.getElementById("event-details");
    
    console.log('🔍 DEBUG viewInvoice - Elementos encontrados:', {
      eventTitleEl: !!eventTitleEl,
      eventDetailsEl: !!eventDetailsEl
    });
    
    if (eventTitleEl) eventTitleEl.textContent = "Cargando...";
    if (eventDetailsEl)
      eventDetailsEl.innerHTML = "<p>Cargando detalles de la proforma...</p>";
    
    console.log('🔍 DEBUG viewInvoice - Intentando mostrar modal...');
    showModal("event-modal");
    console.log('🔍 DEBUG viewInvoice - Modal mostrado, cargando datos...');

    // Cargar datos de la factura desde la API con include
    // Primero intentamos con include para obtener todos los datos relacionados
    try {
      console.log('🔍 DEBUG viewInvoice - Haciendo petición API con include...');
      const response = await fetchWithAuth(
        `${API_BASE_URL}/invoices/${invoiceId}?include=client,service,payments`
      );
      console.log('🔍 DEBUG viewInvoice - Respuesta API:', response);
      const invoice = response.data || response;
      console.log('🔍 DEBUG viewInvoice - Datos de factura procesados:', invoice);
      console.log('🔍 DEBUG viewInvoice - Llamando handleInvoiceData...');
      await handleInvoiceData(invoice, eventTitleEl, eventDetailsEl);
    } catch (corsError) {
      console.log("🔍 DEBUG viewInvoice - Error CORS al cargar con include, intentando sin include:", corsError);
      // Si falla por CORS, intentamos sin include
      try {
        const response = await fetchWithAuth(
          `${API_BASE_URL}/invoices/${invoiceId}`
        );
        console.log('🔍 DEBUG viewInvoice - Respuesta API sin include:', response);
        const invoice = response.data || response;
        console.log('🔍 DEBUG viewInvoice - Datos de factura sin include:', invoice);
        console.log('🔍 DEBUG viewInvoice - Llamando handleInvoiceData...');
        await handleInvoiceData(invoice, eventTitleEl, eventDetailsEl);
      } catch (secondError) {
        console.error('🔍 DEBUG viewInvoice - Error en segunda petición:', secondError);
        throw secondError;
      }
    }
  } catch (error) {
    console.error("Error al visualizar proforma:", error);
    showToast("error", "Error", "No se pudo cargar la proforma");
    closeModal("event-modal");
  }
}

// Implementación temprana de confirmDeleteInvoice para disponibilidad en tabla
confirmDeleteInvoice = async function(invoiceId) {
  try {
    console.log('🔍 DEBUG confirmDeleteInvoice - Iniciando con invoiceId:', invoiceId);
    console.log('🔍 DEBUG confirmDeleteInvoice - Intentando abrir modal de confirmación...');
    console.log('🔍 DEBUG confirmDeleteInvoice - openConfirmModal function:', typeof openConfirmModal);
    
    openConfirmModal(
      "Eliminar Proforma",
      "¿Estás seguro de que deseas eliminar esta proforma? Esta acción no se puede deshacer.",
      async () => {
        try {
          // Mostrar indicador de carga
          showToast("info", "Procesando", "Eliminando proforma...");

          // Realizar petición a la API para eliminar la factura
          const result = await fetchWithAuth(
            `${API_BASE_URL}/invoices/${invoiceId}`,
            "DELETE"
          );

          if (result) {
            showToast("success", "Proforma eliminada exitosamente", "");

            // Recargar datos
            await loadInvoicesData();
            if (typeof loadDashboardData === "function")
              await loadDashboardData();
            if (typeof loadCalendarData === "function")
              await loadCalendarData();
          }
        } catch (error) {
          console.error("Error eliminando proforma:", error);

          // Mostrar error específico si la API lo proporciona
          if (error.message && error.message.includes("en uso")) {
            showToast(
              "error",
              "No se puede eliminar",
              "Esta proforma tiene pagos registrados o está siendo utilizada"
            );
          } else {
            showToast("error", "Error", "No se pudo eliminar la proforma");
          }
        }
      }
    );
    console.log('🔍 DEBUG confirmDeleteInvoice - openConfirmModal llamado exitosamente');
  } catch (error) {
    console.error("🔍 DEBUG confirmDeleteInvoice - Error al abrir modal de confirmación:", error);
    showToast("error", "Error", "No se pudo abrir el modal de confirmación");
  }
}

// Implementación temprana de openInvoiceModal para disponibilidad en tabla
openInvoiceModal = async function(invoiceId = null, contractedService = null) {
  const eventModal = document.getElementById("event-modal");
  if (eventModal && eventModal.style.display === "block")
    eventModal.style.display = "none";

  const form = document.getElementById("invoice-form");
  const modalTitle = document.getElementById("invoice-modal-title");
  const whatsappBtn = document.getElementById("send-whatsapp-btn");
  if (!form || !modalTitle || !whatsappBtn) return;

  form.reset();
  const docPreview = document.getElementById("document-preview");
  if (docPreview) docPreview.innerHTML = "";
  whatsappBtn.disabled = true;

  try {
    await loadInvoiceClientOptions();
    document.getElementById("invoice-id").value = "";

    if (invoiceId) {
      modalTitle.textContent = "Editar Pago";

      // Cargar datos de la factura desde API con datos relacionados
      const response = await fetchWithAuth(
        `${API_BASE_URL}/invoices/${invoiceId}?include=client,service,payments`
      );
      const invoice = response.data || response;
      if (invoice) {
        document.getElementById("invoice-id").value = invoice.id;
        document.getElementById("invoice-number").value = invoice.number;
        document.getElementById("invoice-client").value = invoice.clientId;
        document.getElementById("invoice-amount").value = invoice.amount;
        document.getElementById("invoice-issue-date").value = invoice.issueDate;
        document.getElementById("invoice-due-date").value = invoice.dueDate;
        document.getElementById("invoice-status").value = invoice.status;
        document.getElementById("invoice-document-type").value =
          invoice.documentType || "factura";
        await updateInvoiceServices(); // Load services for this client
        document.getElementById("invoice-service").value = invoice.serviceId;
        if (invoice.document && docPreview)
          docPreview.innerHTML = `<div class="document-item"><i class="fas fa-file-alt"></i><span>${invoice.document.name}</span></div>`;
        whatsappBtn.disabled = false;
      }
    } else if (contractedService) {
      modalTitle.textContent = "Nuevo Pago";
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + contractedService.invoiceDays);
      document.getElementById("invoice-issue-date").value = today
        .toISOString()
        .split("T")[0];
      document.getElementById("invoice-due-date").value = dueDate
        .toISOString()
        .split("T")[0];
      document.getElementById("invoice-client").value =
        contractedService.clientId;
      await updateInvoiceServices();
      document.getElementById("invoice-service").value =
        contractedService.serviceId;
      document.getElementById("invoice-amount").value = contractedService.price;
      await generateInvoiceNumber();
      whatsappBtn.disabled = false; // Can be enabled once client selected
    } else {
      modalTitle.textContent = "Nuevo Pago";
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30);
      document.getElementById("invoice-issue-date").value = today
        .toISOString()
        .split("T")[0];
      document.getElementById("invoice-due-date").value = dueDate
        .toISOString()
        .split("T")[0];
      await generateInvoiceNumber();
    }
    
    // Asegurar que el event listener esté configurado
    const invoiceClientSelect = document.getElementById("invoice-client");
    if (invoiceClientSelect) {
      // Remover event listener anterior si existe
      invoiceClientSelect.removeEventListener("change", updateInvoiceServices);
      // Agregar nuevo event listener
      invoiceClientSelect.addEventListener("change", updateInvoiceServices);
      console.log("✅ DEBUG: Event listener configurado para cambio de cliente en modal");
    }
    
    showModal("invoice-modal");
  } catch (error) {
    console.error("Error al abrir modal de factura:", error);
    showToast(
      "error",
      "Error",
      "No se pudieron cargar los datos de la factura"
    );

    // Mostrar el modal a pesar del error para permitir crear nueva factura
    showModal("invoice-modal");
  }
}

// Implementación temprana de openPartialPaymentModal para disponibilidad en tabla
openPartialPaymentModal = async function(invoiceId) {
  try {
    console.log('🔍 DEBUG openPartialPaymentModal - Iniciando con invoiceId:', invoiceId);
    
    const eventModal = document.getElementById("event-modal");
    if (eventModal && eventModal.style.display === "block") {
      console.log('🔍 DEBUG openPartialPaymentModal - Cerrando event-modal...');
      eventModal.style.display = "none";
    }

    console.log('🔍 DEBUG openPartialPaymentModal - Haciendo petición API...');
    // Cargar datos de la factura desde la API con datos relacionados
    const response = await fetchWithAuth(
      `${API_BASE_URL}/invoices/${invoiceId}?include=client,service,payments`
    );
    console.log('🔍 DEBUG openPartialPaymentModal - Respuesta API:', response);
    const invoice = response.data || response;
    
    if (!invoice) {
      console.log('🔍 DEBUG openPartialPaymentModal - Factura no encontrada');
      showToast("error", "Error", "Proforma no encontrada");
      return;
    }

    const paymentInvoiceNumberEl = document.getElementById("payment-invoice-number");
    const paymentInvoiceIdEl = document.getElementById("payment-invoice-id");
    
    console.log('🔍 DEBUG openPartialPaymentModal - Elementos encontrados:', {
      paymentInvoiceNumberEl: !!paymentInvoiceNumberEl,
      paymentInvoiceIdEl: !!paymentInvoiceIdEl
    });
    
    if (paymentInvoiceNumberEl) paymentInvoiceNumberEl.textContent = invoice.number;
    if (paymentInvoiceIdEl) paymentInvoiceIdEl.value = invoice.id;
    
    // Validar y formatear montos con valores por defecto
    const totalAmount = typeof invoice.amount === 'number' ? invoice.amount : parseFloat(invoice.amount) || 0;
    const paidAmount = typeof invoice.paidAmount === 'number' ? invoice.paidAmount : parseFloat(invoice.paidAmount) || 0;
    const pendingAmount = totalAmount - paidAmount;
    
    console.log('🔍 DEBUG openPartialPaymentModal - Datos originales de la factura:', {
      'invoice.amount': invoice.amount,
      'invoice.paidAmount': invoice.paidAmount,
      'typeof amount': typeof invoice.amount,
      'typeof paidAmount': typeof invoice.paidAmount
    });
    
    console.log('🔍 DEBUG openPartialPaymentModal - Montos calculados:', {
      totalAmount, paidAmount, pendingAmount
    });
    
    document.getElementById(
      "payment-total-amount"
    ).textContent = `S/. ${totalAmount.toFixed(2)}`;
    document.getElementById(
      "payment-paid-amount"
    ).textContent = `S/. ${paidAmount.toFixed(2)}`;
    document.getElementById("payment-pending-amount").textContent = `S/. ${pendingAmount.toFixed(2)}`;
    document.getElementById("payment-date").value = new Date()
      .toISOString()
      .split("T")[0];

    const paymentsList = document.getElementById("partial-payments-list");
    paymentsList.innerHTML = "";

    if (invoice.payments && invoice.payments.length > 0) {
      invoice.payments.forEach((payment) => {
        const item = document.createElement("div");
        item.className = "payment-item";
        const voucherInfo = payment.voucher
          ? `<div class="payment-voucher"><i class="fas fa-file-alt"></i> ${payment.voucher.name}</div>`
          : '<div class="payment-voucher text-muted">Sin voucher</div>';
        const paymentAmount = typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount) || 0;
        item.innerHTML = `<div class="payment-header"><div class="payment-date">${new Date(
          payment.date
        ).toLocaleDateString()}</div><div class="payment-amount">S/. ${paymentAmount.toFixed(
          2
        )}</div></div><div class="payment-method">${capitalizeFirstLetter(
          payment.method
        )}</div>${voucherInfo}<div class="payment-notes">${
          payment.notes || "Sin notas"
        }</div>`;
        paymentsList.appendChild(item);
      });
    } else {
      paymentsList.innerHTML =
        '<div class="empty-payments">No hay pagos registrados.</div>';
    }

    document.getElementById("payment-amount").value = "";
    document.getElementById("payment-notes").value = "";
    document.getElementById("payment-method").value = "efectivo";

    const voucherPreview = document.getElementById("voucher-preview");
    if (voucherPreview) voucherPreview.innerHTML = "";

    console.log('🔍 DEBUG openPartialPaymentModal - Intentando mostrar modal partial-payment-modal...');
    showModal("partial-payment-modal");
    
    // Asignar event listener al formulario después de mostrar el modal
    const paymentForm = document.getElementById("partial-payment-form");
    console.log('🔍 DEBUG: Buscando formulario partial-payment-form...', paymentForm);
    
    if (paymentForm) {
      // Remover event listener anterior si existe
      paymentForm.removeEventListener("submit", handlePartialPaymentSubmit);
      // Agregar nuevo event listener
      paymentForm.addEventListener("submit", handlePartialPaymentSubmit);
      console.log('✅ DEBUG: Event listener asignado al formulario de pagos');
      
      // Verificar que el submit button existe
      const submitBtn = paymentForm.querySelector('button[type="submit"]');
      console.log('🔍 DEBUG: Submit button encontrado:', submitBtn);
      
      // Test adicional - agregar click listener al botón como backup
      if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
          console.log('🔍 DEBUG: Click detectado en submit button');
          if (paymentForm.checkValidity()) {
            console.log('🔍 DEBUG: Formulario válido, ejecutando handlePartialPaymentSubmit...');
            handlePartialPaymentSubmit(e);
          } else {
            console.log('❌ DEBUG: Formulario inválido');
          }
        });
      }
    } else {
      console.error('❌ DEBUG: No se encontró el formulario partial-payment-form');
    }
    
    console.log('🔍 DEBUG openPartialPaymentModal - Modal mostrado exitosamente');
  } catch (error) {
    console.error("🔍 DEBUG openPartialPaymentModal - Error:", error);
    showToast(
      "error",
      "Error",
      "No se pudieron cargar los datos de la factura"
    );
  }
}

// Implementación temprana de loadInvoiceClientOptions para disponibilidad en openInvoiceModal
loadInvoiceClientOptions = async function() {
  const clientSelect = document.getElementById("invoice-client");
  if (!clientSelect) return;

  try {
    clientSelect.innerHTML = '<option value="">Cargando clientes...</option>';

    // Cargar clientes desde la API
    const response = await fetchWithAuth(`${API_BASE_URL}/clients`);
    const clients = response.data || [];

    clientSelect.innerHTML = '<option value="">Seleccionar Cliente</option>';

    if (clients && clients.length > 0) {
      clients
        .filter((c) => c.status === "activo")
        .forEach((client) => {
          clientSelect.add(new Option(client.name, client.id));
        });
    }
  } catch (error) {
    console.error("Error cargando clientes:", error);
    clientSelect.innerHTML =
      '<option value="">Error al cargar clientes</option>';
  }
}

// Función para manejar el envío del formulario de pagos parciales
// Implementación de handlePartialPaymentSubmit (ya declarada al inicio del archivo)
handlePartialPaymentSubmit = async function(event) {
  console.log('🔍 DEBUG handlePartialPaymentSubmit - INICIANDO...');
  event.preventDefault();
  console.log('🔍 DEBUG handlePartialPaymentSubmit - preventDefault ejecutado');

  // Mostrar indicador de carga en el botón de submit
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : "Registrar Pago";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Registrando...";
  }

  try {
    const invoiceId = parseInt(
      document.getElementById("payment-invoice-id").value
    );
    const amount = parseFloat(document.getElementById("payment-amount").value);
    
    console.log('🔍 DEBUG: Datos extraídos del formulario:', { invoiceId, amount });

    // Validaciones básicas
    if (amount <= 0) {
      console.log('❌ DEBUG: Monto inválido:', amount);
      showToast("error", "Error", "El monto debe ser mayor a cero");
      return;
    }

    console.log('🔍 DEBUG: Validación de monto pasada, obteniendo datos de factura...');
    
    // Cargar datos actuales de la factura para validar monto pendiente
    const response = await fetchWithAuth(
      `${API_BASE_URL}/invoices/${invoiceId}`
    );
    
    console.log('🔍 DEBUG: Respuesta de factura:', response);
    
    const invoice = response.data || response;
    
    if (!invoice) {
      showToast("error", "Error", "Proforma no encontrada");
      return;
    }

    console.log('🔍 DEBUG: Datos de factura extraídos:', invoice);

    // Convertir a números para cálculos
    const totalAmount = typeof invoice.amount === 'number' ? invoice.amount : parseFloat(invoice.amount) || 0;
    const paidAmount = typeof invoice.paidAmount === 'number' ? invoice.paidAmount : parseFloat(invoice.paidAmount) || 0;
    const pendingAmount = totalAmount - paidAmount;
    
    console.log('🔍 DEBUG: Montos calculados:', { totalAmount, paidAmount, pendingAmount, amount });
    
    if (amount > pendingAmount + 0.001) {
      console.log('❌ DEBUG: Pago excede monto pendiente');
      showToast(
        "error",
        "Error",
        `Pago excede monto pendiente (S/. ${pendingAmount.toFixed(2)})`
      );
      return;
    }

    console.log('🔍 DEBUG: Validación de monto pendiente pasada, preparando datos de pago...');

    const paymentData = {
      invoiceId: invoiceId,
      date: document.getElementById("payment-date").value,
      amount: amount,
      method: document.getElementById("payment-method").value,
      notes: document.getElementById("payment-notes").value,
    };
    
    console.log('🔍 DEBUG: Datos de pago preparados:', paymentData);

    const voucherInput = document.getElementById("payment-voucher");
    if (voucherInput && voucherInput.files && voucherInput.files.length > 0) {
      const file = voucherInput.files[0];
      paymentData.voucher = { name: file.name, type: file.type, size: file.size };
    }

    // Enviar datos a la API
    const result = await fetchWithAuth(
      `${API_BASE_URL}/invoices/${invoiceId}/payments`,
      "POST",
      paymentData
    );

    if (result) {
      // Cerrar modal
      if (typeof closeModal === 'function') {
        closeModal("partial-payment-modal");
      }
      
      // Mostrar mensaje de éxito
      showToast("success", "Pago registrado exitosamente", "");

      // Verificar si el pago completa la factura
      if (invoice.amount - (invoice.paidAmount + amount) < 0.01) {
        showToast(
          "success",
          "¡Factura pagada!",
          "Se ha completado el pago de la factura"
        );
      }

      // Recargar datos
      if (typeof loadInvoicesData === 'function') await loadInvoicesData();
      if (typeof loadDashboardData === 'function') await loadDashboardData();
    }
  } catch (error) {
    console.error("Error registrando pago parcial:", error);
    showToast("error", "Error", "No se pudo registrar el pago");
  } finally {
    // Restaurar estado del botón
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

// Función para actualizar los servicios disponibles en el formulario de facturas
updateInvoiceServices = async function() {
  const clientId = parseInt(document.getElementById("invoice-client")?.value);
  const serviceSelect = document.getElementById("invoice-service");
  const whatsappBtn = document.getElementById("send-whatsapp-btn");

  if (!serviceSelect) return;
  serviceSelect.innerHTML = '<option value="">Seleccionar Servicio</option>';
  if (whatsappBtn) whatsappBtn.disabled = !clientId;

  if (!clientId) return;

  try {
    serviceSelect.innerHTML = '<option value="">Cargando servicios...</option>';

    // Cargar servicios contratados y servicios disponibles desde la API
    const [contractedServicesResponse, allServicesResponse] = await Promise.all([
      fetchWithAuth(`${API_BASE_URL}/contracted-services?clientId=${clientId}`),
      fetchWithAuth(`${API_BASE_URL}/services`),
    ]);

    const contractedServices = contractedServicesResponse.data || [];
    const allServices = allServicesResponse.data || [];

    serviceSelect.innerHTML = '<option value="">Seleccionar Servicio</option>';

    // Usar servicios contratados si existen, sino mostrar todos los servicios
    const targetServices =
      contractedServices && contractedServices.length > 0
        ? contractedServices
        : allServices.map((s) => ({
            serviceId: s.id,
            price: s.price,
            Service: s,
          }));

    targetServices.forEach((cs_or_s) => {
      // Manejar estructura de servicios contratados vs servicios normales
      const service =
        cs_or_s.Service || allServices.find((s) => s.id === cs_or_s.serviceId);
      if (service) {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent = service.name;
        option.setAttribute("data-price", cs_or_s.price || service.price);
        serviceSelect.appendChild(option);
      }
    });

    // Event listener for service select (moved here to be attached after options are populated)
    // Remove old listener to avoid duplicates if any
    const newServiceSelect = serviceSelect.cloneNode(true);
    serviceSelect.parentNode.replaceChild(newServiceSelect, serviceSelect);

    newServiceSelect.addEventListener("change", () => {
      const selectedOption =
        newServiceSelect.options[newServiceSelect.selectedIndex];
      const amountEl = document.getElementById("invoice-amount");
      if (
        selectedOption &&
        selectedOption.hasAttribute("data-price") &&
        amountEl
      ) {
        amountEl.value = selectedOption.getAttribute("data-price");
      } else if (selectedOption && selectedOption.value && amountEl) {
        const service = allServices.find(
          (s) => s.id === parseInt(selectedOption.value)
        );
        if (service) amountEl.value = service.price;
      }
    });
  } catch (error) {
    console.error("Error cargando servicios:", error);
    if (serviceSelect) {
      serviceSelect.innerHTML =
        '<option value="">Error al cargar servicios</option>';
    }
  }
};

// Función para manejar la carga de documentos
handleDocumentUpload = function(event) {
  const file = event.target.files[0];
  const documentPreview = document.getElementById("document-preview");
  if (!file || !documentPreview) return;
  documentPreview.innerHTML = `<div class="document-item"><i class="fas fa-file-alt"></i><span>${file.name}</span></div>`;
};

// Función para manejar el envío del formulario de facturas (definida aquí para evitar errores de referencia)
// Implementación de handleInvoiceSubmit (ya declarada al inicio del archivo)
handleInvoiceSubmit = async function(event) {
  event.preventDefault();

  // Mostrar indicador de carga en el botón de submit
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : "Guardar";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Guardando...";
  }

  try {
    const invoiceId = document.getElementById("invoice-id").value;
    const isEditing = invoiceId !== "";
    const fileInput = document.getElementById("invoice-document");

    // Crear FormData para enviar archivos
    const formData = new FormData();
    formData.append('number', document.getElementById("invoice-number").value);
    formData.append('clientId', document.getElementById("invoice-client").value);
    formData.append('serviceId', document.getElementById("invoice-service").value);
    formData.append('amount', document.getElementById("invoice-amount").value);
    formData.append('issueDate', document.getElementById("invoice-issue-date").value);
    formData.append('dueDate', document.getElementById("invoice-due-date").value);
    formData.append('status', document.getElementById("invoice-status").value);
    formData.append('documentType', document.getElementById("invoice-document-type").value);

    // Agregar archivo si existe
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      formData.append('invoiceDocument', fileInput.files[0]);
    }

    // Definir URL y método para la API
    let url = `${API_BASE_URL}/invoices`;
    let method = "POST";

    console.log("🔍 DEBUG handleInvoiceSubmit - Datos a enviar:", {
      number: formData.get('number'),
      clientId: formData.get('clientId'),
      hasFile: fileInput && fileInput.files && fileInput.files.length > 0,
      isEditing,
      method,
      url
    });

    if (isEditing) {
      url = `${API_BASE_URL}/invoices/${invoiceId}`;
      method = "PUT";
    }

    // Enviar datos a la API usando FormData
    const result = await fetchWithAuthFormData(url, method, formData);

    if (result) {
      // Mostrar mensaje de éxito
      const successMessage = isEditing
        ? "Pago actualizado exitosamente"
        : "Pago creado exitosamente";
      showToast("success", successMessage, "");

      // Habilitar botón de WhatsApp
      const whatsappBtn = document.getElementById("send-whatsapp-btn");
      if (whatsappBtn) whatsappBtn.disabled = false;

      // Para facturas nuevas, actualizar el ID
      if (!isEditing && result.id && document.getElementById("invoice-id")) {
        document.getElementById("invoice-id").value = result.id;
      }

      // Cerrar modal
      const modal = document.getElementById("invoice-modal");
      if (modal) {
        modal.style.display = "none";
      }

      // Recargar datos
      if (typeof loadInvoicesData === "function") await loadInvoicesData();
      if (typeof loadDashboardData === "function") await loadDashboardData();
      if (typeof loadCalendarData === "function") await loadCalendarData();
    }
  } catch (error) {
    console.error("Error guardando factura:", error);
    showToast("error", "Error", "No se pudo guardar el pago");
  } finally {
    // Restaurar estado del botón
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

// Función para realizar peticiones autenticadas al API
async function fetchWithAuth(url, method = "GET", body = null) {
  // Obtener token del localStorage
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  // Configurar opciones de la petición
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Añadir cuerpo si es necesario
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  // 🔍 DEBUG: Log de la petición
  console.log(`🔍 fetchWithAuth - ${method} ${url}`);
  console.log('🔍 fetchWithAuth - Headers:', options.headers);
  console.log('🔍 fetchWithAuth - Token presente:', !!token);
  console.log('🔍 fetchWithAuth - Token (primeros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');

  // Realizar la petición
  const response = await fetch(url, options);

  // 🔍 DEBUG: Log de la respuesta
  console.log(`🔍 fetchWithAuth - Response status: ${response.status} ${response.statusText}`);
  console.log('🔍 fetchWithAuth - Response headers:', Object.fromEntries(response.headers.entries()));

  // Procesar la respuesta
  const data = await response.json();

  // 🔍 DEBUG: Log de los datos recibidos
  console.log('🔍 fetchWithAuth - Response data:', data);

  // Verificar si la respuesta es exitosa
  if (!response.ok) {
    // Manejar error de autenticación
    if (response.status === 401) {
      handleSessionExpired();
    }
    throw new Error(data.message || `Error en la petición: ${response.status}`);
  }

  return data;
}

// Función similar a fetchWithAuth pero para FormData (archivos)
async function fetchWithAuthFormData(url, method = "POST", formData) {
  // Obtener token del localStorage
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("No hay token de autenticación");
  }

  // Configurar opciones de la petición (sin Content-Type para FormData)
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      // NO agregar Content-Type para FormData, el navegador lo hace automáticamente
    },
    body: formData
  };

  // 🔍 DEBUG: Log de la petición
  console.log(`🔍 fetchWithAuthFormData - ${method} ${url}`);
  console.log('🔍 fetchWithAuthFormData - Headers:', options.headers);
  console.log('🔍 fetchWithAuthFormData - Token presente:', !!token);
  console.log('🔍 fetchWithAuthFormData - Token (primeros 20 chars):', token ? token.substring(0, 20) + '...' : 'N/A');

  // Realizar la petición
  const response = await fetch(url, options);

  // 🔍 DEBUG: Log de la respuesta
  console.log(`🔍 fetchWithAuthFormData - Response status: ${response.status} ${response.statusText}`);
  console.log('🔍 fetchWithAuthFormData - Response headers:', Object.fromEntries(response.headers.entries()));

  // Procesar la respuesta
  const data = await response.json();

  // 🔍 DEBUG: Log de los datos recibidos
  console.log('🔍 fetchWithAuthFormData - Response data:', data);

  // Verificar si la respuesta es exitosa
  if (!response.ok) {
    // Manejar error de autenticación
    if (response.status === 401) {
      handleSessionExpired();
    }
    throw new Error(data.message || `Error en la petición: ${response.status}`);
  }

  return data;
}

// Función auxiliar para manejar la expiración de sesión
function handleSessionExpired() {
  // Limpiar token y datos de usuario
  localStorage.removeItem("authToken");
  currentUser = null;

  // Redirigir al login
  document.getElementById("login-container").classList.remove("hidden");
  document.getElementById("dashboard-container").classList.add("hidden");

  // Mostrar mensaje
  showToast(
    "warning",
    "Sesión expirada",
    "Tu sesión ha expirado. Por favor inicia sesión nuevamente."
  );
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
  const token = localStorage.getItem("authToken");
  return token !== null;
}

// Función para obtener el usuario actual
function getCurrentUser() {
  return currentUser;
}

// Función para cerrar sesión
function logout() {
  // Limpiar datos locales
  localStorage.removeItem("authToken");
  currentUser = null;

  // Limpiar arrays de datos
  filteredClients = [];
  filteredContractedServices = [];
  filteredInvoices = [];

  // Redirigir al login
  document.getElementById("login-container").classList.remove("hidden");
  document.getElementById("dashboard-container").classList.add("hidden");

  showToast("info", "Sesión cerrada", "Has cerrado sesión correctamente");
}

// Función para manejar errores de API de manera consistente
function handleApiError(error, context = "") {
  console.error(`Error en ${context}:`, error);

  if (error.message.includes("No hay token")) {
    handleSessionExpired();
    return;
  }

  // Diferentes tipos de errores
  if (error.message.includes("401")) {
    handleSessionExpired();
  } else if (error.message.includes("403")) {
    showToast(
      "error",
      "Acceso denegado",
      "No tienes permisos para realizar esta acción"
    );
  } else if (error.message.includes("404")) {
    showToast("error", "No encontrado", "El recurso solicitado no existe");
  } else if (error.message.includes("500")) {
    showToast(
      "error",
      "Error del servidor",
      "Error interno del servidor. Intenta más tarde"
    );
  } else {
    showToast("error", "Error", error.message || "Error desconocido");
  }
}

// Función para inicializar la aplicación
async function initApp() {
  console.log("Inicializando aplicación modular...");

  try {
    // Verificar estado del backend
    await checkBackendHealth();

    // Verificar si hay una sesión activa
    if (isAuthenticated()) {
      // Intentar validar el token con el backend
      try {
        await fetchWithAuth(`${API_BASE_URL}/auth/validate`);
        // Token válido, cargar dashboard directamente
        document.getElementById("login-container").classList.add("hidden");
        document
          .getElementById("dashboard-container")
          .classList.remove("hidden");
        await loadDashboardComponents();
        await loadView("dashboard");
        return;
      } catch (error) {
        // Token inválido, limpiar y continuar con login
        handleSessionExpired();
      }
    }

    // Cargar la vista de login
    await loadComponent("views/login.html", "login-container");

    // Adjuntar event listener al formulario de login después de cargarlo
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", handleLogin);
    }
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error);
    showToast(
      "error",
      "Error de conexión",
      "No se puede conectar con el servidor"
    );
  }
}

// Función para verificar el estado del backend
async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL.replace("/api", "")}/`);
    if (!response.ok) {
      throw new Error("Backend no disponible");
    }
    console.log("✅ Backend conectado y funcionando");
    return true;
  } catch (error) {
    console.error("❌ Error de conexión con el backend:", error);
    throw new Error("No se puede conectar con el servidor");
  }
}

// Función para manejar el inicio de sesión
// Implementación de handleLogin (ya declarada al inicio del archivo)
handleLogin = async function(event) {
  event.preventDefault();
  const email =
    document.getElementById("email")?.value ||
    document.getElementById("username")?.value;
  const password = document.getElementById("password").value;

  // Validación básica
  if (!email || !password) {
    showToast("error", "Error", "Por favor completa todos los campos");
    return;
  }

  // Mostrar indicador de carga
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Iniciando sesión...";

  try {
    // Petición al backend para autenticar
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar token en localStorage
      localStorage.setItem("authToken", data.token);

      // Guardar información del usuario
      currentUser = data.user;

      // Mostrar dashboard y ocultar login
      document.getElementById("login-container").classList.add("hidden");
      document.getElementById("dashboard-container").classList.remove("hidden");

      // Cargar los componentes principales del dashboard
      await loadDashboardComponents();

      // Cargar la primera vista (dashboard)
      await loadView("dashboard");

      // Mostrar notificación de bienvenida
      showToast(
        "success",
        "¡Bienvenido al Sistema de Gestión!",
        "Sesión iniciada correctamente"
      );
    } else {
      // Mostrar mensaje de error
      showToast(
        "error",
        "Error de autenticación",
        data.message || "Credenciales incorrectas"
      );
    }
  } catch (error) {
    console.error("Error en el login:", error);
    showToast(
      "error",
      "Error de conexión",
      "No se pudo conectar con el servidor"
    );
  } finally {
    // Restaurar botón
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

// Función para cargar todos los componentes del dashboard
async function loadDashboardComponents() {
  try {
    console.log("Cargando componentes del dashboard...");

    // Cargar componentes de layout
    await loadComponents([
      { url: "components/layout/sidebar.html", targetId: "sidebar-container" },
      { url: "components/layout/header.html", targetId: "header-container" },
    ]);

    // Cargar componentes compartidos
    await loadComponent(
      "components/shared/notification-dropdown.html",
      "notifications-dropdown"
    );

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

    // Cargar toast de notificaciones
    await loadComponent("components/shared/toast.html", "toast");

    // Configurar event listeners para componentes que ya están cargados
    setupComponentEventListeners();

    // Configurar event listeners para modales que ya están cargados
    setupModalEventListeners();

    return true;
  } catch (error) {
    console.error("Error al cargar componentes del dashboard:", error);
    return false;
  }
}

// Configura los event listeners para los componentes cargados dinámicamente
function setupComponentEventListeners() {
  // Event listeners para el menú lateral
  document.querySelectorAll(".menu li").forEach((item) => {
    item.addEventListener("click", () => {
      const sectionName = item.getAttribute("data-section");
      loadView(sectionName);
    });
  });

  // Event listener para cerrar sesión
  setupLogoutButton();

  // Event listeners para notificaciones
  const notificationBell = document.getElementById("notification-bell");
  if (notificationBell) {
    notificationBell.addEventListener("click", function() {
      const dropdown = document.getElementById("notifications-dropdown");
      if (dropdown) {
        dropdown.classList.toggle("show");
      }
    });
  }
  
  const markAllRead = document.getElementById("mark-all-read");
  if (markAllRead) {
    markAllRead.addEventListener("click", markAllNotificationsAsRead);
  }

  // Los event listeners específicos de cada vista o modal se configurarán
  // después de cargar cada componente específico
}

// Función para cargar una vista específica
async function loadView(sectionName) {
  console.log(`Cargando vista: ${sectionName}`);

  // Ocultar todas las secciones
  document.querySelectorAll(".section-content").forEach((el) => {
    el.classList.add("hidden");
  });

  // Cargar la vista solicitada si no tiene contenido
  const viewContainer = document.getElementById(`${sectionName}-section`);
  if (!viewContainer.hasAttribute("data-loaded")) {
    await loadComponent(`views/${sectionName}.html`, `${sectionName}-section`);
    viewContainer.setAttribute("data-loaded", "true");

    // Configurar event listeners específicos de esta vista
    setupViewEventListeners(sectionName);
  }

  // Mostrar la sección solicitada
  viewContainer.classList.remove("hidden");

  // Actualizar la navegación activa
  document.querySelectorAll(".menu li").forEach((item) => {
    item.classList.remove("active");
  });
  const activeMenuItem = document.querySelector(
    `.menu li[data-section="${sectionName}"]`
  );
  if (activeMenuItem) {
    activeMenuItem.classList.add("active");
  }

  // Actualizar sección actual
  currentSection = sectionName;

  // Esperar un pequeño delay para asegurar que el DOM esté disponible, luego cargar datos
  setTimeout(async () => {
    await loadSectionData(sectionName);
  }, 100);
}

// Configura los event listeners específicos para cada vista
function setupViewEventListeners(sectionName) {
  console.log(`Configurando event listeners para vista: ${sectionName}`);

  switch (sectionName) {
    case "clients":
      // Event listeners para la sección de clientes
      document
        .getElementById("add-client-btn")
        .addEventListener("click", () => openClientModal());
      document
        .getElementById("client-status-filter")
        .addEventListener("change", applyClientFilters);
      document
        .getElementById("client-date-filter")
        .addEventListener("change", applyClientFilters);
      document
        .getElementById("client-search")
        .addEventListener("input", applyClientFilters);
      document
        .getElementById("export-clients-btn")
        .addEventListener("click", exportClientsToExcel);
      break;

    case "contracted-services":
      // Event listeners para la sección de servicios contratados
      document
        .getElementById("add-contracted-service-btn")
        .addEventListener("click", () => openContractedServiceModal());
      document
        .getElementById("contracted-service-filter")
        .addEventListener("change", applyContractedServiceFiltersAPI);
      document
        .getElementById("contracted-payment-type-filter")
        .addEventListener("change", applyContractedServiceFiltersAPI);
      document
        .getElementById("contracted-status-filter")
        .addEventListener("change", applyContractedServiceFiltersAPI);
      document
        .getElementById("contracted-client-filter")
        .addEventListener("change", applyContractedServiceFiltersAPI);
      document
        .getElementById("export-contracted-services-btn")
        .addEventListener("click", exportContractedServicesToExcel);
      break;

    case "services":
      // Event listeners para la sección de servicios
      document
        .getElementById("add-service-btn")
        .addEventListener("click", () => openServiceModal());
      document
        .getElementById("export-services-btn")
        .addEventListener("click", exportServicesToExcel);
      break;

    case "invoices":
      // Event listeners para la sección de proformas
      document
        .getElementById("add-invoice-btn")
        .addEventListener("click", () => openInvoiceModal());
      document
        .getElementById("invoice-client-filter")
        .addEventListener("change", () => applyInvoiceFilters());
      document
        .getElementById("invoice-service-filter")
        .addEventListener("change", () => applyInvoiceFilters());
      document
        .getElementById("invoice-status-filter")
        .addEventListener("change", () => applyInvoiceFilters());
      document
        .getElementById("invoice-date-filter")
        .addEventListener("change", () => applyInvoiceFilters());
      const exportButton = document.getElementById("export-invoices-btn");
      if (exportButton) {
        exportButton.addEventListener("click", exportInvoicesToExcel);
        console.log("✅ DEBUG: Event listener agregado al botón de exportar proformas");
      } else {
        console.error("❌ DEBUG: No se encontró el botón export-invoices-btn");
      }
      
      // Event listener para cambio de cliente en modal de facturas
      const invoiceClientSelect = document.getElementById("invoice-client");
      if (invoiceClientSelect) {
        // Remover event listener anterior si existe
        invoiceClientSelect.removeEventListener("change", updateInvoiceServices);
        // Agregar nuevo event listener
        invoiceClientSelect.addEventListener("change", updateInvoiceServices);
        console.log("✅ DEBUG: Event listener agregado al select de cliente en modal de facturas");
      } else {
        console.log("⚠️ DEBUG: invoice-client select no encontrado (se agregará cuando se abra el modal)");
      }
      break;

    case "calendar":
      // Event listeners para la sección de calendario
      document
        .getElementById("prev-month")
        .addEventListener("click", () => changeCalendarMonth(-1));
      document
        .getElementById("next-month")
        .addEventListener("click", () => changeCalendarMonth(1));
      document
        .getElementById("export-calendar-btn")
        .addEventListener("click", exportCalendarToExcel);
      break;

    case "settings":
      // Event listeners para la sección de configuración
      setupCompanySettingsForm();
      setupAlertsSettingsForm();
      setupPasswordForm();
      break;
  }
}

// Configura los event listeners para los modales una vez cargados
function setupModalEventListeners() {
  // Cliente
  document
    .getElementById("close-client-modal")
    .addEventListener("click", () => closeModal("client-modal"));
  document
    .getElementById("cancel-client-btn")
    .addEventListener("click", () => closeModal("client-modal"));
  document
    .getElementById("client-form")
    .addEventListener("submit", handleClientSubmit);

  // Servicio Contratado
  document
    .getElementById("close-contracted-service-modal")
    .addEventListener("click", () => closeModal("contracted-service-modal"));
  document
    .getElementById("cancel-contracted-service-btn")
    .addEventListener("click", () => closeModal("contracted-service-modal"));
  document
    .getElementById("contracted-service-form")
    .addEventListener("submit", handleContractedServiceSubmitAPI);
  document
    .getElementById("contracted-service")
    .addEventListener("change", updateContractedServicePrice);

  // Servicio
  document
    .getElementById("close-service-modal")
    .addEventListener("click", () => closeModal("service-modal"));
  document
    .getElementById("cancel-service-btn")
    .addEventListener("click", () => closeModal("service-modal"));
  document
    .getElementById("service-form")
    .addEventListener("submit", handleServiceSubmit);

  // Proforma
  document
    .getElementById("close-invoice-modal")
    .addEventListener("click", () => closeModal("invoice-modal"));
  document
    .getElementById("cancel-invoice-btn")
    .addEventListener("click", () => closeModal("invoice-modal"));
  document
    .getElementById("invoice-form")
    .addEventListener("submit", handleInvoiceSubmit);
  document
    .getElementById("invoice-client")
    .addEventListener("change", updateInvoiceServices);
  document
    .getElementById("invoice-document")
    .addEventListener("change", handleDocumentUpload);
  document
    .getElementById("send-whatsapp-btn")
    .addEventListener("click", sendInvoiceByWhatsApp);

  // Pagos Parciales
  document
    .getElementById("close-partial-payment-modal")
    .addEventListener("click", () => closeModal("partial-payment-modal"));
  document
    .getElementById("cancel-payment-btn")
    .addEventListener("click", () => closeModal("partial-payment-modal"));
  // Event listener para formulario de pagos se asigna dinámicamente en openPartialPaymentModal
  // document.getElementById("partial-payment-form").addEventListener("submit", handlePartialPaymentSubmit);
  
  // Event listener para voucher si el elemento existe
  const voucherInput = document.getElementById("payment-voucher");
  if (voucherInput) {
    voucherInput.addEventListener("change", handleVoucherUpload);
  }

  // Confirmación
  document
    .getElementById("close-confirm-modal")
    .addEventListener("click", () => closeModal("confirm-modal"));
  document
    .getElementById("cancel-confirm-btn")
    .addEventListener("click", () => closeModal("confirm-modal"));

  // Evento
  document
    .getElementById("close-event-modal")
    .addEventListener("click", () => closeModal("event-modal"));
  document
    .getElementById("close-event-btn")
    .addEventListener("click", () => closeModal("event-modal"));
}

// Variable para evitar event listeners duplicados
let invoiceActionListenerAdded = false;

// Configura los event listeners para los botones de acción de facturas usando event delegation
function setupInvoiceActionListeners() {
  console.log('Configurando event delegation para botones de acción de facturas...');
  
  // Evitar agregar múltiples event listeners
  if (invoiceActionListenerAdded) {
    console.log('Event listener ya configurado, saltando...');
    return;
  }
  
  // Event delegation para la tabla de facturas
  document.addEventListener('click', function(e) {
    // Verificar si el click fue en un botón de acción
    const actionBtn = e.target.closest('.action-btn');
    if (!actionBtn) return;
    
    // Obtener la acción y el ID de la factura
    const action = actionBtn.getAttribute('data-action');
    const invoiceId = actionBtn.getAttribute('data-invoice-id');
    
    if (!action || !invoiceId) return;
    
    console.log(`✅ Ejecutando acción: ${action} para factura ID: ${invoiceId}`);
    
    // Ejecutar la acción correspondiente
    switch (action) {
      case 'view':
        console.log('Ejecutando viewInvoice...');
        if (typeof viewInvoice === 'function') {
          viewInvoice(invoiceId);
        } else {
          console.error('Función viewInvoice no encontrada');
        }
        break;
      case 'edit':
        console.log('Ejecutando openInvoiceModal...');
        if (typeof openInvoiceModal === 'function') {
          openInvoiceModal(invoiceId);
        } else {
          console.error('Función openInvoiceModal no encontrada');
        }
        break;
      case 'delete':
        console.log('Ejecutando confirmDeleteInvoice...');
        if (typeof confirmDeleteInvoice === 'function') {
          confirmDeleteInvoice(invoiceId);
        } else {
          console.error('Función confirmDeleteInvoice no encontrada');
        }
        break;
      case 'payment':
        console.log('Ejecutando openPartialPaymentModal...');
        if (typeof openPartialPaymentModal === 'function') {
          openPartialPaymentModal(invoiceId);
        } else {
          console.error('Función openPartialPaymentModal no encontrada');
        }
        break;
      case 'download':
        console.log('Ejecutando downloadInvoiceDocument...');
        if (typeof downloadInvoiceDocument === 'function') {
          downloadInvoiceDocument(invoiceId);
        } else {
          console.error('Función downloadInvoiceDocument no encontrada');
        }
        break;
      case 'whatsapp':
        console.log('Ejecutando sendInvoiceByWhatsApp...');
        if (typeof sendInvoiceByWhatsApp === 'function') {
          sendInvoiceByWhatsApp(invoiceId);
        } else {
          console.error('Función sendInvoiceByWhatsApp no encontrada');
        }
        break;
      default:
        console.warn(`Acción desconocida: ${action}`);
    }
  });
  
  // Marcar que el event listener ya fue agregado
  invoiceActionListenerAdded = true;
  console.log('Event delegation configurado correctamente');
}

// Carga los datos específicos para cada sección
async function loadSectionData(sectionName) {
  console.log(`Cargando datos para sección: ${sectionName}`);

  switch (sectionName) {
    case "dashboard":
      await loadDashboardData();
      break;
    case "clients":
      loadClientsData();
      break;
    case "contracted-services":
      loadContractedServicesData();
      break;
    case "services":
      loadServicesData();
      break;
    case "invoices":
      loadInvoicesData();
      break;
    case "calendar":
      loadCalendarData();
      break;
  }
}

// Función para manejar el cierre de sesión
// Función para configurar el botón de logout
function setupLogoutButton() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
    console.log("✅ Event listener de logout configurado");
  } else {
    console.log("⚠️ Botón de logout no encontrado, reintentando en 500ms...");
    setTimeout(setupLogoutButton, 500);
  }
}

// Implementación de handleLogout (ya declarada al inicio del archivo)
handleLogout = function() {
  console.log("🔍 Ejecutando logout...");
  
  // Eliminar el token JWT del localStorage
  localStorage.removeItem("authToken");
  console.log("✅ Token eliminado del localStorage");

  // Limpiar datos de usuario
  currentUser = null;
  
  // Limpiar arrays globales
  filteredClients = [];
  filteredContractedServices = [];
  filteredInvoices = [];

  // Mostrar login y ocultar dashboard
  const loginContainer = document.getElementById("login-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  
  if (loginContainer) {
    loginContainer.classList.remove("hidden");
    console.log("✅ Login container mostrado");
  }
  
  if (dashboardContainer) {
    dashboardContainer.classList.add("hidden");
    console.log("✅ Dashboard container ocultado");
  }

  // Limpiar campos de login
  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");
  
  if (usernameField) usernameField.value = "";
  if (passwordField) passwordField.value = "";

  console.log("✅ Logout completado - recargando página");
  
  // Recargar la página para asegurar limpieza completa
  window.location.reload();
}

// Inicialización cuando se carga la página
document.addEventListener("DOMContentLoaded", function () {
  // Iniciar la aplicación
  initApp();
});

// Nota: Las funciones restantes del app.js original (loadDashboardData, etc.)
// se mantienen sin cambios y deberían ser incluidas aquí, pero se omiten por brevedad.

// --- INICIO DE FUNCIONES COPIADAS/ADAPTADAS DEL app.js ORIGINAL ---

// Funciones de utilidad
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Implementación completa de showToast (actualiza la implementación inicial)
showToast = function(message, type = "info", duration = 3000) {
  const toast = document.getElementById("toast"); // Asume que toast.html ya se cargó
  if (!toast) {
    console.warn("Contenedor de Toast no encontrado. Mensaje:", message);
    alert(message); // Fallback si el toast no está listo
    return;
  }
  const toastMessage = document.getElementById("toast-message");
  const toastIcon = document.getElementById("toast-icon");

  if (!toastMessage || !toastIcon) {
    console.warn(
      "Elementos internos del Toast no encontrados. Mensaje:",
      message
    );
    alert(message);
    return;
  }

  toastMessage.textContent = message;

  toastIcon.className = "fas"; // Reset class
  if (type === "success") toastIcon.classList.add("fa-check-circle");
  else if (type === "error") toastIcon.classList.add("fa-times-circle");
  else if (type === "warning") toastIcon.classList.add("fa-exclamation-circle");
  else toastIcon.classList.add("fa-info-circle"); // Default to info

  toast.classList.remove("hidden");

  // Para la animación de progreso (si toast.html tiene .toast-progress)
  const toastProgress = toast.querySelector(".toast-progress");
  if (toastProgress) {
    toastProgress.style.animation = "none"; // Reset animation
    setTimeout(() => {
      // Restart animation
      toastProgress.style.animation = `progress ${
        duration / 1000
      }s linear forwards`;
    }, 10);
  }

  setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}

// Implementación de showModal (ya declarada al inicio del archivo)
showModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
    // Simple z-index management if multiple modals can be open (though usually one at a time)
    const allModals = document.querySelectorAll(".modal");
    let maxZIndex = 100; // Base z-index for modals
    allModals.forEach((m) => {
      if (m.style.display === "block") {
        const currentZIndex =
          parseInt(window.getComputedStyle(m).zIndex) || 100;
        if (currentZIndex >= maxZIndex) {
          maxZIndex = currentZIndex + 1;
        }
      }
    });
    modal.style.zIndex = maxZIndex;
  } else {
    console.error(`Modal con ID '${modalId}' no encontrado.`);
  }
}

// Implementación de la función closeModal (ya declarada al inicio del archivo)
closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    modal.style.zIndex = ""; // Reset z-index
  }
  // Cerrar notificaciones si están abiertas (código original de closeModal)
  const notificationsDropdown = document.getElementById(
    "notifications-dropdown"
  );
  if (
    notificationsDropdown &&
    !notificationsDropdown.classList.contains("hidden")
  ) {
    notificationsDropdown.classList.add("hidden");
  }
}

// Implementación de openConfirmModal (ya declarada al inicio del archivo)
openConfirmModal = function(title, message, confirmCallback) {
  const modalTitle = document.getElementById("confirm-title");
  const modalMessage = document.getElementById("confirm-message");
  const confirmButton = document.getElementById("confirm-action-btn");

  if (modalTitle) modalTitle.textContent = title;
  if (modalMessage) modalMessage.textContent = message;

  if (confirmButton) {
    // Clonar y reemplazar para evitar listeners duplicados si se llama múltiples veces
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    newConfirmButton.onclick = () => {
      confirmCallback();
      closeModal("confirm-modal");
    };
  }
  showModal("confirm-modal");
}

// Funciones de Dashboard
// Implementación de loadDashboardData (variable declarada al inicio del archivo)
loadDashboardData = async function() {
  try {
    const totalClientsEl = document.getElementById("total-clients");
    const activeServicesEl = document.getElementById("active-services");
    const pendingInvoicesEl = document.getElementById("pending-invoices");
    const monthlyRevenueEl = document.getElementById("monthly-revenue");

    // Mostrar indicadores de carga
    if (totalClientsEl) totalClientsEl.textContent = "...";
    if (activeServicesEl) activeServicesEl.textContent = "...";
    if (pendingInvoicesEl) pendingInvoicesEl.textContent = "...";
    if (monthlyRevenueEl) monthlyRevenueEl.textContent = "...";

    // Realizar peticiones en paralelo para mejor rendimiento
    const [clientsResponse, servicesResponse, invoicesResponse] =
      await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/clients?status=activo`),
        fetchWithAuth(`${API_BASE_URL}/contracted-services?status=activo`),
        fetchWithAuth(`${API_BASE_URL}/invoices?status=pendiente`),
      ]);

    // Actualizar contadores con datos de la API
    if (totalClientsEl && clientsResponse.data) {
      totalClientsEl.textContent = clientsResponse.data.length;
    }

    if (activeServicesEl && servicesResponse.data) {
      activeServicesEl.textContent = servicesResponse.data.length;
    }

    if (pendingInvoicesEl && invoicesResponse.data) {
      pendingInvoicesEl.textContent = invoicesResponse.data.length;
    }

    // Calcular ingresos del mes
    if (monthlyRevenueEl) {
      await calculateMonthlyRevenue(monthlyRevenueEl);
    }

    // Cargar otros elementos del dashboard
    await loadRevenueChart();
    await loadUpcomingDeadlines();
  } catch (error) {
    console.error("Error cargando datos del dashboard:", error);
    showToast(
      "error",
      "Error",
      "No se pudieron cargar los datos del dashboard"
    );

    // Mostrar error en contadores
    const elements = [
      document.getElementById("total-clients"),
      document.getElementById("active-services"),
      document.getElementById("pending-invoices"),
      document.getElementById("monthly-revenue"),
    ];

    elements.forEach((el) => {
      if (el) el.textContent = "Error";
    });
  }
}

// Función auxiliar para calcular ingresos del mes
async function calculateMonthlyRevenue(monthlyRevenueEl) {
  try {
    // Intentar usar endpoint específico de estadísticas si existe
    try {
      const statsResponse = await fetchWithAuth(
        `${API_BASE_URL}/stats/monthly-revenue`
      );
      if (statsResponse.data && statsResponse.data.totalRevenue !== undefined) {
        monthlyRevenueEl.textContent = `S/. ${statsResponse.data.totalRevenue.toFixed(
          2
        )}`;
        return;
      }
    } catch (error) {
      console.log(
        "Endpoint de estadísticas no disponible, calculando manualmente"
      );
    }

    // Si no hay endpoint específico, calcular con facturas pagadas
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() es 0-indexado
    const currentYear = now.getFullYear();

    // Crear fechas para filtrar
    const startDate = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const endDate = `${currentYear}-${currentMonth
      .toString()
      .padStart(2, "0")}-${lastDay}`;

    // Obtener facturas pagadas del mes actual
    const paidInvoicesResponse = await fetchWithAuth(
      `${API_BASE_URL}/invoices?status=pagada&startDate=${startDate}&endDate=${endDate}`
    );

    // Calcular suma de montos
    let revenue = 0;
    if (paidInvoicesResponse.data && paidInvoicesResponse.data.length > 0) {
      revenue = paidInvoicesResponse.data.reduce(
        (sum, invoice) => sum + invoice.amount,
        0
      );
    }

    monthlyRevenueEl.textContent = `S/. ${revenue.toFixed(2)}`;
  } catch (error) {
    console.error("Error calculando ingresos mensuales:", error);
    monthlyRevenueEl.textContent = "N/A";
  }
}

function getServiceColor(serviceId) {
  const colors = [
    "#3f51b5",
    "#7986cb",
    "#5c6bc0",
    "#9c27b0",
    "#ab47bc",
    "#673ab7",
    "#7e57c2",
  ];
  return colors[(serviceId - 1) % colors.length];
}

function abbreviateServiceName(name) {
  const abbreviations = {
    "Declaración Mensual": "Decl. Mensual",
    "Consultoría Tributaria": "Consultoría",
    "Contabilidad Completa": "Contabilidad",
    "Auditoría Financiera": "Auditoría",
    "Implementación de Sistema Contable": "Implementación",
  };
  return abbreviations[name] || name;
}

async function loadRevenueChart() {
  try {
    const chartContainer = document.getElementById("services-chart");
    if (!chartContainer) return;

    // Mostrar indicador de carga
    chartContainer.innerHTML =
      "<div class='text-center p-4'>Cargando datos del gráfico...</div>";

    const API_BASE_URL = "http://localhost:5000/api";

    // Intentar usar endpoint específico de estadísticas si existe
    try {
      const statsResponse = await fetchWithAuth(
        `${API_BASE_URL}/stats/revenue-by-service`
      );
      if (
        statsResponse.data &&
        statsResponse.data.services &&
        Array.isArray(statsResponse.data.services)
      ) {
        // Mapear totalRevenue a revenue para compatibilidad
        const mappedServices = statsResponse.data.services.map(service => ({
          id: service.serviceId,
          name: service.serviceName,
          revenue: service.totalRevenue,
          color: getServiceColor(service.serviceId)
        }));
        
        // Calcular maxRevenue para el eje Y
        const maxRevenue = Math.max(...mappedServices.map((s) => s.revenue), 3000);
        
        renderRevenueChart(chartContainer, mappedServices, maxRevenue);
        return;
      }
    } catch (error) {
      console.log(
        "Endpoint de estadísticas no disponible, calculando manualmente"
      );
    }

    // Si no hay endpoint específico, calcular en el frontend (Opción A)
    // Obtener servicios y facturas en paralelo
    const [servicesResponse, invoicesResponse, contractedServicesResponse] =
      await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/services`),
        fetchWithAuth(`${API_BASE_URL}/invoices?status=pagada`),
        fetchWithAuth(`${API_BASE_URL}/contracted-services?status=activo`),
      ]);

    // Procesar datos
    const services = servicesResponse.data || [];
    const invoices = invoicesResponse.data || [];
    const contractedServices = contractedServicesResponse.data || [];

    // Calcular ingresos por servicio
    const serviceRevenues = [];

    services.forEach((service) => {
      let totalRevenue = 0;

      // Sumar ingresos de facturas pagadas
      invoices.forEach((invoice) => {
        // Verificar si la factura corresponde a este servicio
        // Nota: Ajustar según la estructura de datos real
        if (
          invoice.serviceId === service.id ||
          (invoice.contractedService &&
            invoice.contractedService.serviceId === service.id)
        ) {
          totalRevenue += invoice.amount || 0;
        }
      });

      // Opcionalmente sumar montos de servicios contratados activos
      contractedServices.forEach((cs) => {
        if (
          cs.serviceId === service.id ||
          (cs.service && cs.service.id === service.id)
        ) {
          totalRevenue += cs.price || 0;
        }
      });

      serviceRevenues.push({
        id: service.id,
        name: service.name,
        revenue: totalRevenue,
        color: getServiceColor(service.id),
      });
    });

    // Ordenar por ingresos
    serviceRevenues.sort((a, b) => b.revenue - a.revenue);

    // Mostrar los 5 principales
    const servicesToShow = serviceRevenues.slice(0, 5);

    // Establecer valor mínimo para el eje Y
    const maxRevenue = Math.max(...servicesToShow.map((s) => s.revenue), 3000); // Mínimo 3000 para el eje Y

    // Renderizar el gráfico
    renderRevenueChart(chartContainer, servicesToShow, maxRevenue);
  } catch (error) {
    console.error("Error cargando datos del gráfico:", error);
    const chartContainer = document.getElementById("services-chart");
    if (chartContainer) {
      chartContainer.innerHTML =
        "<div class='alert alert-danger m-3'>Error al cargar datos del gráfico. Intente nuevamente más tarde.</div>";
    }
  }
}

// Función auxiliar para renderizar el gráfico
function renderRevenueChart(chartContainer, servicesToShow, maxRevenue) {
  // Limpiar contenedor
  chartContainer.innerHTML = "";

  // Si no hay datos
  if (!servicesToShow || servicesToShow.length === 0) {
    const noDataMsg = document.createElement("div");
    noDataMsg.className = "text-center p-3";
    noDataMsg.textContent = "No hay datos de ingresos disponibles.";
    chartContainer.appendChild(noDataMsg);
    return;
  }

  // Crear contenedor de barras
  const barsContainer = document.createElement("div");
  barsContainer.className = "chart-bars-container";

  // Crear barras para cada servicio
  servicesToShow.forEach((service, index) => {
    const height = (service.revenue / maxRevenue) * 100;
    const barWrapper = document.createElement("div");
    barWrapper.className = "chart-bar-wrapper";
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.setProperty("--bar-height", `${height}%`);
    bar.style.height = `${height}%`; // Fallback if CSS var not supported
    bar.style.backgroundColor = service.color || getServiceColor(service.id);
    bar.style.animationDelay = `${index * 0.1}s`;
    const value = document.createElement("div");
    value.className = "chart-value";
    value.textContent = `S/. ${(service.revenue / 1000).toFixed(1)}k`;
    value.style.bottom = `${height + 3}%`;
    const label = document.createElement("div");
    label.className = "chart-label";
    label.textContent = abbreviateServiceName(service.name);
    label.setAttribute("title", service.name);
    barWrapper.appendChild(bar);
    barWrapper.appendChild(value);
    barWrapper.appendChild(label);
    barsContainer.appendChild(barWrapper);
    bar.addEventListener("click", () => {
      showToast(
        `Ingresos de ${service.name}: S/. ${service.revenue.toFixed(2)}`,
        "info"
      );
    });
  });

  // Agregar al contenedor principal
  chartContainer.appendChild(barsContainer);

  // Actualizar etiquetas del eje Y
  const yLabels = document.querySelectorAll("#dashboard-section .y-axis span"); // Be more specific
  if (yLabels.length > 0) {
    const yStep = maxRevenue / (yLabels.length - 1);
    for (let i = 0; i < yLabels.length; i++) {
      const val = maxRevenue - i * yStep;
      yLabels[i].textContent =
        val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val.toFixed(0)}`;
    }
  }
}

async function loadUpcomingDeadlines() {
  console.log("🔍 DEBUG: loadUpcomingDeadlines - INICIANDO");
  try {
    const upcomingContainer = document.getElementById("upcoming-deadlines");
    console.log("🔍 DEBUG: upcomingContainer encontrado:", !!upcomingContainer);
    if (!upcomingContainer) {
      console.log("🔍 DEBUG: No se encontró el elemento upcoming-deadlines");
      return;
    }

    upcomingContainer.innerHTML = '<div class="text-center p-3">Cargando próximos vencimientos...</div>';
    const API_BASE_URL = "http://localhost:5000/api";
    const today = new Date();

    const [contractedServicesResponse, invoicesResponse] = await Promise.all([
      fetchWithAuth(`${API_BASE_URL}/contracted-services?status=activo`),
      fetchWithAuth(`${API_BASE_URL}/invoices?status=pendiente`),
    ]);

    const upcomingPayments = [];
    console.log("🔍 DEBUG: Servicios contratados recibidos:", contractedServicesResponse.data?.length || 0);
    
    // Si no hay datos del backend, crear datos de prueba
    if (!contractedServicesResponse.data || contractedServicesResponse.data.length === 0) {
      console.log("🔍 DEBUG: No hay datos del backend - mostrando mensaje vacío");
      contractedServicesResponse.data = [];
    }
    
    // DEBUG: Inspeccionar estructura del primer servicio
    if (contractedServicesResponse.data && contractedServicesResponse.data.length > 0) {
      console.log("🔍 DEBUG: Primer servicio contratado (datos crudos):", contractedServicesResponse.data[0]);
    }

    if (contractedServicesResponse.data && contractedServicesResponse.data.length > 0) {
      contractedServicesResponse.data.forEach((cs, index) => {
        // Crear fechas de próximo pago para mostrar datos
        let nextPaymentDate;
        if (cs.nextPayment) {
          nextPaymentDate = new Date(cs.nextPayment);
        } else {
          // Crear fechas próximas para todos los servicios
          const baseDate = new Date();
          baseDate.setDate(baseDate.getDate() + 5 + (index * 3)); // Espaciar cada 3 días
          nextPaymentDate = baseDate;
        }
        
        const daysUntilPayment = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilPayment >= 0 && daysUntilPayment <= 30) {
          const clientName = cs.client?.name || cs.clientName || `Cliente ID ${cs.clientId}`;
          const serviceName = cs.service?.name || cs.serviceName || `Servicio ID ${cs.serviceId}`;
          
          upcomingPayments.push({
            id: `cs-${cs.id}`,
            clientName: clientName,
            serviceName: serviceName,
            date: nextPaymentDate,
            daysLeft: daysUntilPayment,
            type: "payment",
            entityId: cs.id,
          });
        }
      });
    }

    if (invoicesResponse.data && invoicesResponse.data.length > 0) {
      invoicesResponse.data.forEach((invoice) => {
        if (invoice.dueDate) {
          const dueDate = new Date(invoice.dueDate);
          const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

          if (daysUntilDue >= 0 && daysUntilDue <= 30) {
            // ----- LA CORRECCIÓN ESTÁ AQUÍ -----
            const clientName = invoice.client?.name || invoice.clientName || `Cliente ID ${invoice.clientId}`;
            const serviceName = invoice.service?.name || invoice.serviceName || `Servicio ID ${invoice.serviceId}`;
            
            upcomingPayments.push({
              id: `inv-${invoice.id}`,
              clientName: clientName,
              serviceName: serviceName,
              date: dueDate,
              daysLeft: daysUntilDue,
              type: "invoice",
              entityId: invoice.id,
            });
          }
        }
      });
    }

    upcomingPayments.sort((a, b) => a.daysLeft - b.daysLeft);
    const paymentsToShow = upcomingPayments.slice(0, 5);

    upcomingContainer.innerHTML = "";

    if (paymentsToShow.length === 0) {
      upcomingContainer.innerHTML = '<p class="text-muted">No hay pagos próximos en los siguientes 30 días.</p>';
      return;
    }

    paymentsToShow.forEach((payment) => {
      const item = document.createElement("div");
      item.className = "upcoming-item";

      let daysLabelClass = "days-success";
      if (payment.daysLeft <= 5) daysLabelClass = "days-danger";
      else if (payment.daysLeft <= 10) daysLabelClass = "days-warning";

      item.innerHTML = `
        <div>
          <div class="upcoming-client">${payment.clientName}</div>
          <div class="upcoming-service">${payment.serviceName} ${payment.type === "invoice" ? "(Proforma)" : ""}</div>
        </div>
        <div class="upcoming-date">
          <span>${payment.date.toLocaleDateString()}</span>
          <div class="days-label ${daysLabelClass}">${payment.daysLeft} días</div>
        </div>`;

      item.addEventListener("click", () => {
        if (payment.type === "payment") {
          loadView("contracted-services");
          if (typeof openContractedServiceModal === "function") {
            setTimeout(() => openContractedServiceModal(payment.entityId), 300);
          }
        } else {
          loadView("invoices");
          if (typeof openInvoiceModal === "function") {
            setTimeout(() => openInvoiceModal(payment.entityId), 300);
          }
        }
      });
      upcomingContainer.appendChild(item);
    });
  } catch (error) {
    console.error("Error cargando próximos vencimientos:", error);
    const upcomingContainer = document.getElementById("upcoming-deadlines");
    if (upcomingContainer) {
      upcomingContainer.innerHTML = '<div class="alert alert-danger m-3">Error al cargar próximos vencimientos.</div>';
    }
  }
}

// Funciones de Clientes
// Implementación de loadClientsData (ya declarada al inicio del archivo)
loadClientsData = async function() {
  try {
    // Mostrar indicador de carga
    const tableBody = document.querySelector("#clients-table tbody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="8" class="text-center">Cargando clientes...</td></tr>';
    }

    // Realizar petición a la API
    const API_BASE_URL = "http://localhost:5000/api";
    const result = await fetchWithAuth(`${API_BASE_URL}/clients`);

    // Actualizar datos
    filteredClients = result.data || [];

    // Renderizar tabla y actualizar paginación
    renderClientsTable();
    updateClientPagination();
  } catch (error) {
    console.error("Error cargando clientes:", error);
    const tableBody = document.querySelector("#clients-table tbody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="8" class="text-center">Error al cargar clientes. Intente nuevamente.</td></tr>';
    }
    showToast("error", "Error", "No se pudieron cargar los clientes");
  }
}

// Implementación de renderClientsTable (ya declarada al inicio del archivo)
renderClientsTable = function() {
  const tableBody = document.querySelector("#clients-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  const startIndex = (currentClientPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);
  if (paginatedClients.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center">No se encontraron clientes.</td></tr>`;
    return;
  }
  paginatedClients.forEach((client) => {
    const row = document.createElement("tr");
    const joinDate = new Date(client.joinDate);
    const formattedJoinDate = joinDate.toLocaleDateString();
    let statusClass =
      client.status === "activo" ? "status-active" : "status-pending";
    row.innerHTML = `<td>${client.name}</td><td>${
      client.ruc
    }</td><td>${client.phone}</td><td>${client.email}</td><td>${
      client.address
    }</td><td><span class="status-badge ${statusClass}">${capitalizeFirstLetter(
      client.status
    )}</span></td><td>${formattedJoinDate}</td><td><div class="table-actions"><div class="action-btn view-btn" onclick="viewClient(${
      client.id
    })"><i class="fas fa-eye"></i></div><div class="action-btn edit-btn" onclick="openClientModal(${
      client.id
    })"><i class="fas fa-edit"></i></div><div class="action-btn delete-btn" onclick="confirmDeleteClient(${
      client.id
    })"><i class="fas fa-trash"></i></div></div></td>`;
    tableBody.appendChild(row);
  });
}

async function viewClient(clientId) {
  try {
    // Buscar cliente en los datos ya cargados
    const client = filteredClients.find((c) => c.id === clientId);
    if (!client) {
      showToast("error", "Error", "Cliente no encontrado");
      return;
    }

    // Obtener servicios contratados de la API
    const servicesResponse = await fetchWithAuth(
      `${API_BASE_URL}/contracted-services?clientId=${clientId}`
    );
    const clientServices = servicesResponse.data || [];

    showToast(
      "info",
      "Info",
      `${client.name} tiene ${clientServices.length} servicios contratados. Ver en sección "Servicios Contratados".`
    );
    openClientModal(clientId, true); // true for readOnly
  } catch (error) {
    console.error("Error viewing client:", error);
    showToast("error", "Error", "No se pudo cargar la información del cliente");
  }
}

// Implementación de updateClientPagination (ya declarada al inicio del archivo)
updateClientPagination = function() {
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginationContainer = document.getElementById("clients-pagination"); // ID from clients.html
  if (!paginationContainer) return;

  // Load pagination.html if not already loaded for this specific pagination instance
  if (!paginationContainer.hasAttribute("data-pagination-loaded")) {
    loadComponent(
      "components/shared/pagination.html",
      "clients-pagination"
    ).then(() => {
      paginationContainer.setAttribute("data-pagination-loaded", "true");
      setupClientPaginationControls(totalPages, paginationContainer);
    });
  } else {
    setupClientPaginationControls(totalPages, paginationContainer);
  }
}

// Implementación de setupClientPaginationControls (ya declarada al inicio del archivo)
setupClientPaginationControls = function(totalPages, paginationContainer) {
  const paginationNumbers = paginationContainer.querySelector(
    ".pagination-numbers"
  ); // Use class for placeholder
  if (!paginationNumbers) return;
  paginationNumbers.innerHTML = "";

  if (currentClientPage > totalPages && totalPages > 0)
    currentClientPage = totalPages;
  else if (totalPages === 0) currentClientPage = 1;

  let startPage = Math.max(1, currentClientPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `pagination-number ${
      i === currentClientPage ? "active" : ""
    }`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      // Using onclick for simplicity here, can be addEventListener
      currentClientPage = i;
      renderClientsTable();
      updateClientPagination(); // This will re-call setupClientPaginationControls
    };
    paginationNumbers.appendChild(pageBtn);
  }
  const prevBtn = paginationContainer.querySelector(
    '.pagination-btn[data-page="prev"]'
  );
  const nextBtn = paginationContainer.querySelector(
    '.pagination-btn[data-page="next"]'
  );
  if (prevBtn) {
    prevBtn.disabled = currentClientPage === 1;
    prevBtn.onclick = () => {
      if (currentClientPage > 1) {
        currentClientPage--;
        renderClientsTable();
        updateClientPagination();
      }
    };
  }
  if (nextBtn) {
    nextBtn.disabled = currentClientPage === totalPages || totalPages === 0;
    nextBtn.onclick = () => {
      if (currentClientPage < totalPages) {
        currentClientPage++;
        renderClientsTable();
        updateClientPagination();
      }
    };
  }
}

// Implementación de applyClientFilters (ya declarada al inicio del archivo)
applyClientFilters = async function() {
  try {
    // Mostrar indicador de carga
    const tableBody = document.querySelector("#clients-table tbody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">Aplicando filtros...</td></tr>';
    }

    // Obtener valores de filtros
    const statusFilter = document.getElementById("client-status-filter")?.value;
    const dateFilter = document.getElementById("client-date-filter")?.value;
    const searchFilter = document
      .getElementById("client-search")
      ?.value.toLowerCase()
      .trim();

    // Construir URL con parámetros de filtro
    const API_BASE_URL = "http://localhost:5000/api";
    let url = `${API_BASE_URL}/clients`;
    const params = new URLSearchParams();

    if (statusFilter) {
      params.append("status", statusFilter);
    }

    if (searchFilter) {
      params.append("search", searchFilter);
    }

    if (dateFilter) {
      // Si la API soporta filtro de fecha
      params.append("joinDate", dateFilter);
    }

    // Agregar parámetros a la URL si existen
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Realizar petición a la API
    const result = await fetchWithAuth(url);

    // Actualizar datos
    filteredClients = result.data || [];

    // Si se tiene filtro de fecha pero la API no lo soporta, filtrar en el frontend
    if (dateFilter && !params.has("joinDate")) {
      const [yearFilter, monthFilter] = dateFilter.split("-");
      filteredClients = filteredClients.filter((client) => {
        const joinDate = new Date(client.joinDate);
        return (
          joinDate.getFullYear() === parseInt(yearFilter) &&
          joinDate.getMonth() + 1 === parseInt(monthFilter)
        );
      });
    }

    // Resetear a la primera página y actualizar UI
    currentClientPage = 1;
    renderClientsTable();
    updateClientPagination();
  } catch (error) {
    console.error("Error aplicando filtros:", error);
    const tableBody = document.querySelector("#clients-table tbody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center">Error al aplicar filtros. Intente nuevamente.</td></tr>';
    }
    showToast("error", "Error", "No se pudieron aplicar los filtros");
  }
}

// Implementación de openClientModal (ya declarada al inicio del archivo)
openClientModal = async function(clientId = null, readOnly = false) {
  const form = document.getElementById("client-form");
  const modalTitle = document.getElementById("client-modal-title");
  if (!form || !modalTitle) {
    console.error("Elementos del modal de cliente no encontrados.");
    return;
  }

  // Resetear formulario
  form.reset();
  document.getElementById("client-id").value = ""; // Limpiamos primero el ID

  // Configurar estado de controles según modo (lectura o edición)
  const inputs = form.querySelectorAll("input, select");
  inputs.forEach((input) => (input.disabled = readOnly));

  const cancelButton = document.getElementById("cancel-client-btn");
  const submitButton = form.querySelector("button[type='submit']");
  if (cancelButton) cancelButton.style.display = readOnly ? "none" : "block";
  if (submitButton) submitButton.style.display = readOnly ? "none" : "block";

  // Mensaje de carga en los campos mientras se obtienen datos
  if (clientId) {
    modalTitle.textContent = readOnly ? "Ver Cliente" : "Editar Cliente";

    const loadingFields = ["name", "ruc", "phone", "email", "address"];
    loadingFields.forEach((field) => {
      document.getElementById(`client-${field}`).value = "Cargando...";
    });

    try {
      // Realizar petición a la API para obtener datos del cliente
      const API_BASE_URL = "http://localhost:5000/api";
      const result = await fetchWithAuth(`${API_BASE_URL}/clients/${clientId}`);

      if (result.data) {
        const client = result.data;
        // Llenar el formulario con los datos
        document.getElementById("client-id").value = client.id;
        document.getElementById("client-name").value = client.name;
        document.getElementById("client-ruc").value = client.ruc;
        document.getElementById("client-phone").value = client.phone;
        document.getElementById("client-email").value = client.email;
        document.getElementById("client-address").value = client.address;
        document.getElementById("client-status").value = client.status;
      }
    } catch (error) {
      console.error("Error cargando datos del cliente:", error);
      showToast(
        "error",
        "Error",
        "No se pudieron cargar los datos del cliente"
      );

      // Limpiar campos en caso de error
      loadingFields.forEach((field) => {
        document.getElementById(`client-${field}`).value = "";
      });
    }
  } else {
    modalTitle.textContent = "Nuevo Cliente";
  }
  showModal("client-modal");
}

// Implementación de handleClientSubmit (ya declarada al inicio del archivo)
handleClientSubmit = async function(event) {
  event.preventDefault();

  // Mostrar indicador de carga en el botón de submit
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Guardando...";

  try {
    // Obtener datos del formulario
    const clientId = document.getElementById("client-id").value;
    const isEditing = clientId !== "";

    // Preparar datos del cliente para enviar a la API
    const clientData = {
      name: document.getElementById("client-name").value,
      ruc: document.getElementById("client-ruc").value,
      phone: document.getElementById("client-phone").value,
      email: document.getElementById("client-email").value,
      address: document.getElementById("client-address").value,
      status: document.getElementById("client-status").value,
    };

    // Validación de RUC (11 dígitos para empresas peruanas)
    if (clientData.ruc) {
      // Limpiar RUC de espacios y caracteres no numéricos
      clientData.ruc = clientData.ruc.replace(/\D/g, "");

      // Validar longitud y que no sean todos ceros
      if (clientData.ruc.length !== 11) {
        showToast(
          "error",
          "Error de validación",
          "El RUC debe tener exactamente 11 dígitos numéricos"
        );
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }

      if (
        clientData.ruc === "00000000000" ||
        clientData.ruc === "11111111111"
      ) {
        showToast(
          "error",
          "Error de validación",
          "El RUC no puede ser todos ceros o todos unos"
        );
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }

      // Validación básica del dígito verificador del RUC (simplificada)
      if (!clientData.ruc.match(/^(10|15|17|20)[0-9]{9}$/)) {
        showToast(
          "error",
          "Error de validación",
          "El RUC debe comenzar con 10, 15, 17 o 20 seguido de 9 dígitos"
        );
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        return;
      }
    }

    // Para nuevos clientes, agregar fecha de registro
    if (!isEditing) {
      clientData.joinDate = new Date().toISOString().split("T")[0];
    }

    // Definir URL de la API
    const API_BASE_URL = "http://localhost:5000/api";
    let url = `${API_BASE_URL}/clients`;
    let method = "POST";

    // Si estamos editando, modificar URL y método
    if (isEditing) {
      url = `${API_BASE_URL}/clients/${clientId}`;
      method = "PUT";
    }

    // Enviar datos a la API
    const result = await fetchWithAuth(url, method, clientData);

    // Procesar respuesta
    if (result) {
      // Mostrar mensaje de éxito
      const successMessage = isEditing
        ? "Cliente actualizado exitosamente"
        : "Cliente creado exitosamente";
      showToast("success", successMessage, "");

      // Cerrar modal y recargar datos
      closeModal("client-modal");
      await loadClientsData();

      // Actualizar dashboard si existe la función
      if (typeof loadDashboardData === "function") {
        await loadDashboardData();
      }
    }
  } catch (error) {
    console.error("Error guardando cliente:", error);
    showToast("error", "Error", "No se pudo guardar el cliente");
  } finally {
    // Restaurar estado del botón
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

async function confirmDeleteClient(clientId) {
  try {
    // Verificar si el cliente tiene servicios contratados o facturas asociadas
    // Podríamos verificarlo mediante la API si existe un endpoint específico o mediante una validación en el backend
    // Por ahora, intentamos directamente eliminar y manejamos el error del servidor si no se puede

    openConfirmModal(
      "Eliminar Cliente",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      async () => {
        try {
          // Mostrar indicador de carga
          showToast("info", "Procesando", "Eliminando cliente...");

          // Realizar petición a la API para eliminar el cliente
          const API_BASE_URL = "http://localhost:5000/api";
          const result = await fetchWithAuth(
            `${API_BASE_URL}/clients/${clientId}`,
            "DELETE"
          );

          // Mostrar mensaje de éxito
          showToast("success", "Cliente eliminado exitosamente", "");

          // Recargar datos
          await loadClientsData();

          // Actualizar dashboard si existe la función
          if (typeof loadDashboardData === "function") {
            await loadDashboardData();
          }
        } catch (error) {
          console.error("Error eliminando cliente:", error);

          // Mostrar mensaje específico si el cliente tiene dependencias
          if (
            error.message &&
            (error.message.includes("servicios contratados") ||
              error.message.includes("facturas asociadas") ||
              error.message.includes("dependencias"))
          ) {
            showToast(
              "error",
              "No se puede eliminar",
              "El cliente tiene servicios contratados o facturas asociadas"
            );
          } else {
            showToast("error", "Error", "No se pudo eliminar el cliente");
          }
        }
      }
    );
  } catch (error) {
    console.error("Error al intentar eliminar cliente:", error);
    showToast("error", "Error", "No se pudo procesar la solicitud");
  }
}

// Implementación de exportClientsToExcel (ya declarada al inicio del archivo)
exportClientsToExcel = async function() {
  try {
    showToast("info", "Procesando", "Preparando archivo de Excel...");

    // Obtener todos los clientes de la API
    const result = await fetchWithAuth(`${API_BASE_URL}/clients`);
    const clients = result.data || [];

    if (clients.length === 0) {
      showToast("warning", "Sin datos", "No hay clientes para exportar");
      return;
    }

    // Preparar datos para Excel
    let excelData = [
      [
        "ID",
        "Nombre",
        "RUC",
        "Teléfono",
        "Email",
        "Dirección",
        "Estado",
        "Fecha de Ingreso",
      ],
    ];
    clients.forEach((client) => {
      const joinDate = client.joinDate
        ? new Date(client.joinDate).toLocaleDateString()
        : "";
      excelData.push([
        client.id,
        client.name,
        client.ruc,
        client.phone,
        client.email,
        client.address,
        client.status,
        joinDate,
      ]);
    });

    // Crear workbook utilizando XLSX
    const wb = XLSX.utils.book_new();
    
    // Crear worksheet desde los datos
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Configurar ancho de columnas para mejor visualización
    const colWidths = [
      { wch: 5 },   // ID
      { wch: 25 },  // Nombre
      { wch: 12 },  // RUC
      { wch: 15 },  // Teléfono
      { wch: 25 },  // Email
      { wch: 30 },  // Dirección
      { wch: 10 },  // Estado
      { wch: 15 }   // Fecha de Ingreso
    ];
    ws['!cols'] = colWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    
    // Generar nombre de archivo con fecha actual
    const fileName = `Clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, fileName);
    
    showToast(
      "success",
      "Exportación completa",
      `${clients.length} clientes exportados a ${fileName}`
    );
    console.log("Datos exportados para Excel:", excelData);
  } catch (error) {
    console.error("Error exportando clientes:", error);
    showToast("error", "Error", "No se pudo exportar los clientes");
  }
}

// Funciones de Servicios Contratados (similar a Clientes)
// Implementación de loadContractedServicesData (ya declarada al inicio del archivo)
loadContractedServicesData = async function() {
  try {
    // Mostrar indicador de carga
    const tableBody = document.querySelector(
      "#contracted-services-table tbody"
    );
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center p-4">Cargando servicios contratados...</td></tr>';
    }

    // Definir API URL
    const API_BASE_URL = "http://localhost:5000/api";

    // Obtener servicios contratados de la API
    // Intentar primero con include, si falla, intentar sin include
    let result;
    try {
      result = await fetchWithAuth(`${API_BASE_URL}/contracted-services?include=client,service`);
    } catch (corsError) {
      console.log("Error CORS al cargar con include, intentando sin include:", corsError);
      result = await fetchWithAuth(`${API_BASE_URL}/contracted-services`);
    }

    // Verificar que la respuesta contiene datos
    if (!result.data) {
      filteredContractedServices = [];
      if (tableBody) {
        tableBody.innerHTML =
          '<tr><td colspan="10" class="text-center">No se encontraron servicios contratados</td></tr>';
      }
      return;
    }

    // Actualizar variable global con datos de la API
    filteredContractedServices = [...result.data];

    // Cargar opciones de filtros y renderizar tabla
    await loadContractedServicesFilterOptionsAPI();
    renderContractedServicesTable();
    updateContractedServicePagination();
  } catch (error) {
    console.error("Error cargando servicios contratados:", error);
    filteredContractedServices = [];
    const tableBody = document.querySelector(
      "#contracted-services-table tbody"
    );
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="9" class="text-center text-danger">Error al cargar servicios contratados</td></tr>';
    }
    showToast(
      "error",
      "Error",
      "No se pudieron cargar los servicios contratados"
    );
  }
}

async function loadContractedServicesFilterOptionsAPI() {
  try {
    const API_BASE_URL = "http://localhost:5000/api";

    // Cargar servicios y clientes en paralelo para los filtros
    const [servicesResult, clientsResult] = await Promise.all([
      fetchWithAuth(`${API_BASE_URL}/services`),
      fetchWithAuth(`${API_BASE_URL}/clients?status=activo`),
    ]);

    const serviceFilter = document.getElementById("contracted-service-filter");
    const clientFilter = document.getElementById("contracted-client-filter");

    if (serviceFilter && servicesResult.data) {
      serviceFilter.innerHTML = '<option value="">Todos</option>';
      servicesResult.data.forEach((service) =>
        serviceFilter.add(new Option(service.name, service.id))
      );
    }

    if (clientFilter && clientsResult.data) {
      clientFilter.innerHTML = '<option value="">Todos</option>';
      clientsResult.data.forEach((client) =>
        clientFilter.add(new Option(client.name, client.id))
      );
    }
  } catch (error) {
    console.error("Error cargando opciones de filtro:", error);
    // Mantener opciones básicas en caso de error
    const serviceFilter = document.getElementById("contracted-service-filter");
    const clientFilter = document.getElementById("contracted-client-filter");
    if (serviceFilter)
      serviceFilter.innerHTML = '<option value="">Todos</option>';
    if (clientFilter)
      clientFilter.innerHTML = '<option value="">Todos</option>';
  }
}

// Implementación de renderContractedServicesTable (ya declarada al inicio del archivo)
renderContractedServicesTable = function() {
  const tableBody = document.querySelector("#contracted-services-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";
  const startIndex = (currentContractedServicePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredContractedServices.slice(
    startIndex,
    endIndex
  );

  if (paginatedServices.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No se encontraron servicios contratados.</td></tr>`;
    return;
  }
  paginatedServices.forEach((cs) => {
    // Los datos del cliente y servicio vienen incluidos desde la API
    const client = cs.client || cs.Client; // Manejar diferentes formatos de respuesta
    const service = cs.service || cs.Service; // Manejar diferentes formatos de respuesta

    if (!client || !service) {
      console.warn("Servicio contratado sin datos de cliente o servicio:", cs);
      return;
    }

    const row = document.createElement("tr");
    const startDate = new Date(cs.startDate).toLocaleDateString();
    const nextPayment = cs.nextPayment
      ? new Date(cs.nextPayment).toLocaleDateString()
      : "No programado";
    const paymentType = service.type === "mensual" ? "Mensual" : "Temporal";
    let daysToExpiration = 0;
    let daysClass = "";
    if (cs.nextPayment) {
      const nextPaymentDate = new Date(cs.nextPayment);
      daysToExpiration = Math.ceil(
        (nextPaymentDate - currentDate) / (1000 * 60 * 60 * 24)
      );
      if (daysToExpiration <= 0) daysClass = "status-alert";
      else if (daysToExpiration <= 5) daysClass = "status-alert";
      else if (daysToExpiration <= 10) daysClass = "status-pending";
      else daysClass = "status-active";
    }
    let statusClass = "";
    if (cs.status === "activo") statusClass = "status-active";
    else if (cs.status === "pendiente") statusClass = "status-pending";
    else if (cs.status === "alerta") statusClass = "status-alert";

    // Validar y formatear precio correctamente (soporta string o number)
    const formattedPrice = cs.price ? 
      (typeof cs.price === "number" ? cs.price.toFixed(2) : parseFloat(cs.price).toFixed(2)) 
      : "0.00";

    row.innerHTML = `<td>${client.name}</td><td>${
      service.name
    }</td><td>${paymentType}</td><td>${startDate}</td><td>${nextPayment}</td><td>S/. ${formattedPrice}</td><td><span class="status-badge ${statusClass}">${capitalizeFirstLetter(
      cs.status
    )}</span></td><td><span class="status-badge ${daysClass}">${daysToExpiration}</span></td><td><div class="table-actions"><div class="action-btn view-btn" onclick="viewContractedService(${
      cs.id
    })"><i class="fas fa-eye"></i></div><div class="action-btn edit-btn" onclick="openContractedServiceModal(${
      cs.id
    })"><i class="fas fa-edit"></i></div><div class="action-btn delete-btn" onclick="confirmDeleteContractedServiceAPI(${
      cs.id
    })"><i class="fas fa-trash"></i></div></div></td>`;
    tableBody.appendChild(row);
  });
}

// Función para manejar los datos del servicio contratado y mostrarlos en el modal
function handleContractedServiceData(cs, eventTitleEl, eventDetailsEl) {
  if (!cs) {
    showToast("error", "Error", "Servicio contratado no encontrado");
    closeModal("event-modal");
    return;
  }

  // Verificar que se incluyeron client y service
  const client = cs.Client || cs.client;
  const service = cs.Service || cs.service;
  if (!client || !service) {
    showToast(
      "error",
      "Error",
      "No se pudieron cargar todos los datos del servicio"
    );
    closeModal("event-modal");
    return;
  }

  // Calcular estado de pago
  let paymentStatus = "No hay pagos programados";
  let daysUntilNextPayment = 0;
  if (cs.nextPayment) {
    const nextPaymentDate = new Date(cs.nextPayment);
    const currentDate = new Date();
    daysUntilNextPayment = Math.ceil(
      (nextPaymentDate - currentDate) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilNextPayment < 0) paymentStatus = "Pago vencido";
    else if (daysUntilNextPayment <= 5)
      paymentStatus = `Vence en ${daysUntilNextPayment} días (urgente)`;
    else if (daysUntilNextPayment <= 10)
      paymentStatus = `Vence en ${daysUntilNextPayment} días (próximo)`;
    else paymentStatus = `Vence en ${daysUntilNextPayment} días`;
  }

  // Preparar detalles del servicio contratado
  const details = `
          <h3>Detalles del Servicio Contratado</h3>
          <p><strong>Cliente:</strong> ${client.name}</p>
          <p><strong>RUC/DNI:</strong> ${client.ruc || "No especificado"}</p>
          <p><strong>Servicio:</strong> ${service.name}</p>
          <p><strong>Tipo:</strong> ${
            service.type === "mensual" ? "Mensual" : "Temporal"
          }</p>
          <p><strong>Fecha de inicio:</strong> ${new Date(
            cs.startDate
          ).toLocaleDateString()}</p>
          <p><strong>Próximo pago:</strong> ${
            cs.nextPayment
              ? new Date(cs.nextPayment).toLocaleDateString()
              : "No programado"
          }</p>
          <p><strong>Estado de pago:</strong> ${paymentStatus}</p>
          <p><strong>Días para vencimiento:</strong> ${daysUntilNextPayment}</p>
          <p><strong>Precio:</strong> S/. ${
            cs.price && typeof cs.price === "number"
              ? cs.price.toFixed(2)
              : "0.00"
          }</p>
          <p><strong>Estado:</strong> ${capitalizeFirstLetter(cs.status)}</p>
          <p><strong>Días para factura:</strong> ${cs.invoiceDays} días</p>
          <div class="action-buttons" style="margin-top:20px;">
              <button class="btn btn-primary" onclick="openContractedServiceModal(${
                cs.id
              })">
                  <i class="fas fa-edit"></i> Editar Contrato
              </button>
              <button class="btn btn-success" onclick="openInvoiceModal(null, ${JSON.stringify(
                cs
              ).replace(/"/g, "&quot;")})">
                  <i class="fas fa-file-invoice"></i> Generar Factura
              </button>
          </div>
      `;

  // Actualizar modal con los datos
  if (eventTitleEl) eventTitleEl.textContent = `Servicio: ${service.name}`;
  if (eventDetailsEl) eventDetailsEl.innerHTML = details;
}

async function viewContractedService(csId) {
  try {
    // Mostrar indicador de carga
    const eventTitleEl = document.getElementById("event-title");
    const eventDetailsEl = document.getElementById("event-details");
    if (eventTitleEl) eventTitleEl.textContent = "Cargando...";
    if (eventDetailsEl)
      eventDetailsEl.innerHTML =
        "<p>Cargando detalles del servicio contratado...</p>";
    showModal("event-modal");

    // Intentar primero con include para obtener todos los datos relacionados
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/contracted-services/${csId}?include=client,service`
      );
      const cs = response.data || response;
      handleContractedServiceData(cs, eventTitleEl, eventDetailsEl);
    } catch (corsError) {
      console.log("Error CORS al cargar con include, intentando sin include:", corsError);
      // Si falla por CORS, intentamos sin include
      const response = await fetchWithAuth(
        `${API_BASE_URL}/contracted-services/${csId}`
      );
      const cs = response.data || response;
      handleContractedServiceData(cs, eventTitleEl, eventDetailsEl);
    }
  } catch (error) {
    console.error("Error al cargar detalles del servicio contratado:", error);
    showToast("error", "Error", "No se pudo cargar el servicio contratado");
    closeModal("event-modal");
  }
}

// Implementación de updateContractedServicePagination (ya declarada al inicio del archivo)
updateContractedServicePagination = function() {
  // Similar to updateClientPagination
  const totalPages = Math.ceil(
    filteredContractedServices.length / itemsPerPage
  );
  const paginationContainer = document.getElementById(
    "contracted-services-pagination"
  );
  if (!paginationContainer) return;

  if (!paginationContainer.hasAttribute("data-pagination-loaded")) {
    loadComponent(
      "components/shared/pagination.html",
      "contracted-services-pagination"
    ).then(() => {
      paginationContainer.setAttribute("data-pagination-loaded", "true");
      setupContractedServicePaginationControls(totalPages, paginationContainer);
    });
  } else {
    setupContractedServicePaginationControls(totalPages, paginationContainer);
  }
}

// Implementación de setupContractedServicePaginationControls (ya declarada al inicio del archivo)
setupContractedServicePaginationControls = function(
  totalPages,
  paginationContainer
) {
  const paginationNumbers = paginationContainer.querySelector(
    ".pagination-numbers"
  );
  if (!paginationNumbers) return;
  paginationNumbers.innerHTML = "";

  if (currentContractedServicePage > totalPages && totalPages > 0)
    currentContractedServicePage = totalPages;
  else if (totalPages === 0) currentContractedServicePage = 1;

  let startPage = Math.max(1, currentContractedServicePage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `pagination-number ${
      i === currentContractedServicePage ? "active" : ""
    }`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => {
      currentContractedServicePage = i;
      renderContractedServicesTable();
      updateContractedServicePagination();
    };
    paginationNumbers.appendChild(pageBtn);
  }
  const prevBtn = paginationContainer.querySelector(
    '.pagination-btn[data-page="prev"]'
  );
  const nextBtn = paginationContainer.querySelector(
    '.pagination-btn[data-page="next"]'
  );
  if (prevBtn) {
    prevBtn.disabled = currentContractedServicePage === 1;
    prevBtn.onclick = () => {
      if (currentContractedServicePage > 1) {
        currentContractedServicePage--;
        renderContractedServicesTable();
        updateContractedServicePagination();
      }
    };
  }
  if (nextBtn) {
    nextBtn.disabled =
      currentContractedServicePage === totalPages || totalPages === 0;
    nextBtn.onclick = () => {
      if (currentContractedServicePage < totalPages) {
        currentContractedServicePage++;
        renderContractedServicesTable();
        updateContractedServicePagination();
      }
    };
  }
}

// Implementación de applyContractedServiceFiltersAPI (ya declarada al inicio del archivo)
applyContractedServiceFiltersAPI = async function() {
  try {
    // Obtener valores de los filtros del DOM
    const serviceFilter = document.getElementById(
      "contracted-service-filter"
    )?.value;
    const paymentTypeFilter = document.getElementById(
      "contracted-payment-type-filter"
    )?.value;
    const statusFilter = document.getElementById(
      "contracted-status-filter"
    )?.value;
    const clientFilter = document.getElementById(
      "contracted-client-filter"
    )?.value;

    // Construir query parameters para la API
    const queryParams = new URLSearchParams();

    if (serviceFilter) queryParams.append("serviceId", serviceFilter);
    if (clientFilter) queryParams.append("clientId", clientFilter);
    if (statusFilter) queryParams.append("status", statusFilter);
    if (paymentTypeFilter) queryParams.append("paymentType", paymentTypeFilter);

    // Mostrar indicador de carga
    const tableBody = document.querySelector(
      "#contracted-services-table tbody"
    );
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="10" class="text-center p-4">Aplicando filtros...</td></tr>';
    }

    // Realizar petición a la API con filtros
    const API_BASE_URL = "http://localhost:5000/api";
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/contracted-services${
      queryString ? "?" + queryString : ""
    }`;

    const result = await fetchWithAuth(url);

    // Actualizar datos filtrados
    if (result.data) {
      filteredContractedServices = [...result.data];
    } else {
      filteredContractedServices = [];
    }

    // Resetear paginación y renderizar tabla
    currentContractedServicePage = 1;
    renderContractedServicesTable();
    updateContractedServicePagination();
  } catch (error) {
    console.error("Error aplicando filtros:", error);
    showToast("error", "Error", "No se pudieron aplicar los filtros");

    // En caso de error, cargar todos los datos sin filtros
    await loadContractedServicesData();
  }
}

// Implementación de openContractedServiceModal (ya declarada al inicio del archivo)
openContractedServiceModal = async function(csId = null) {
  try {
    const form = document.getElementById("contracted-service-form");
    const modalTitle = document.getElementById(
      "contracted-service-modal-title"
    );
    if (!form || !modalTitle) return;

    // Resetear formulario
    form.reset();
    document.getElementById("contracted-service-id").value = "";

    // Cargar opciones de clientes y servicios desde la API en paralelo
    await Promise.all([
      loadContractedServiceClientOptionsAPI(),
      loadContractedServiceOptionsAPI(),
    ]);

    if (csId) {
      modalTitle.textContent = "Editar Servicio Contratado";

      // Mostrar indicadores de carga en los campos mientras se obtienen los datos
      const loadingFields = [
        "contracted-client",
        "contracted-service",
        "contracted-start-date",
        "contracted-next-payment",
        "contracted-price",
        "contracted-status",
        "contracted-invoice-days",
      ];
      loadingFields.forEach((field) => {
        const element = document.getElementById(field);
        if (element) element.disabled = true;
      });

      // Obtener datos del servicio contratado desde la API
      const API_BASE_URL = "http://localhost:5000/api";
      const result = await fetchWithAuth(
        `${API_BASE_URL}/contracted-services/${csId}`
      );

      if (result.data) {
        const cs = result.data;
        // Poblar formulario con datos obtenidos
        document.getElementById("contracted-service-id").value = cs.id;
        document.getElementById("contracted-client").value = cs.clientId;
        document.getElementById("contracted-service").value = cs.serviceId;
        document.getElementById("contracted-start-date").value = cs.startDate;
        document.getElementById("contracted-next-payment").value =
          cs.nextPayment || "";
        document.getElementById("contracted-price").value = cs.price;
        document.getElementById("contracted-status").value = cs.status;
        document.getElementById("contracted-invoice-days").value =
          cs.invoiceDays || 30;
      }

      // Rehabilitar campos
      loadingFields.forEach((field) => {
        const element = document.getElementById(field);
        if (element) element.disabled = false;
      });
    } else {
      modalTitle.textContent = "Nuevo Servicio Contratado";
      // Establecer valores por defecto para nuevo servicio
      const today = new Date();
      document.getElementById("contracted-start-date").value = today
        .toISOString()
        .split("T")[0];

      const nextPayment = new Date();
      nextPayment.setDate(today.getDate() + 30);
      document.getElementById("contracted-next-payment").value = nextPayment
        .toISOString()
        .split("T")[0];

      document.getElementById("contracted-invoice-days").value = 30;
      document.getElementById("contracted-status").value = "activo";
    }

    // Mostrar el modal
    showModal("contracted-service-modal");
  } catch (error) {
    console.error("Error al abrir modal de servicio contratado:", error);
    showToast(
      "error",
      "Error",
      "No se pudieron cargar los datos del servicio contratado"
    );

    // Rehabilitar campos en caso de error
    const fields = [
      "contracted-client",
      "contracted-service",
      "contracted-start-date",
      "contracted-next-payment",
      "contracted-price",
      "contracted-status",
      "contracted-invoice-days",
    ];
    fields.forEach((field) => {
      const element = document.getElementById(field);
      if (element) {
        element.disabled = false;
        if (field !== "contracted-client" && field !== "contracted-service") {
          element.value = "";
        }
      }
    });

    // Mostrar el modal a pesar del error (para permitir crear un nuevo servicio)
    showModal("contracted-service-modal");
  }
}

async function loadContractedServiceClientOptionsAPI() {
  try {
    const clientSelect = document.getElementById("contracted-client");
    if (!clientSelect) return;

    // Mostrar opción de carga
    clientSelect.innerHTML = '<option value="">Cargando clientes...</option>';

    const API_BASE_URL = "http://localhost:5000/api";
    const result = await fetchWithAuth(`${API_BASE_URL}/clients?status=activo`);

    // Limpiar y poblar select
    clientSelect.innerHTML = '<option value="">Seleccionar Cliente</option>';

    if (result.data && result.data.length > 0) {
      result.data.forEach((client) =>
        clientSelect.add(new Option(client.name, client.id))
      );
    }
  } catch (error) {
    console.error("Error cargando clientes:", error);
    const clientSelect = document.getElementById("contracted-client");
    if (clientSelect) {
      clientSelect.innerHTML =
        '<option value="">Error cargando clientes</option>';
    }
  }
}

async function loadContractedServiceOptionsAPI() {
  try {
    const serviceSelect = document.getElementById("contracted-service");
    if (!serviceSelect) return;

    // Mostrar opción de carga
    serviceSelect.innerHTML = '<option value="">Cargando servicios...</option>';

    const API_BASE_URL = "http://localhost:5000/api";
    const result = await fetchWithAuth(`${API_BASE_URL}/services`);

    // Limpiar y poblar select con data-price para updateContractedServicePrice
    serviceSelect.innerHTML = '<option value="">Seleccionar Servicio</option>';

    if (result.data && result.data.length > 0) {
      result.data.forEach((service) => {
        const option = new Option(service.name, service.id);
        option.setAttribute("data-price", service.price || 0);
        serviceSelect.add(option);
      });
    }
  } catch (error) {
    console.error("Error cargando servicios:", error);
    const serviceSelect = document.getElementById("contracted-service");
    if (serviceSelect) {
      serviceSelect.innerHTML =
        '<option value="">Error cargando servicios</option>';
    }
  }
}

function updateContractedServicePrice() {
  const serviceSelect = document.getElementById("contracted-service");
  const priceInput = document.getElementById("contracted-price");

  if (!serviceSelect || !priceInput) return;

  const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
  if (selectedOption && selectedOption.value) {
    // Obtener precio del atributo data-price que se estableció en loadContractedServiceOptionsAPI
    const price = selectedOption.getAttribute("data-price");
    if (price) {
      priceInput.value = parseFloat(price).toFixed(2);
    }
  } else {
    // Limpiar precio si no hay servicio seleccionado
    priceInput.value = "";
  }
}

// Implementación de handleContractedServiceSubmitAPI (ya declarada al inicio del archivo)
handleContractedServiceSubmitAPI = async function(event) {
  event.preventDefault();

  // Mostrar indicador de carga en el botón de submit
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Guardando...";

  try {
    // Obtener datos del formulario
    const csId = document.getElementById("contracted-service-id").value;
    const isEditing = csId !== "";

    // Preparar datos del servicio contratado para enviar a la API
    const csData = {
      clientId: parseInt(document.getElementById("contracted-client").value),
      serviceId: parseInt(document.getElementById("contracted-service").value),
      startDate: document.getElementById("contracted-start-date").value,
      nextPayment:
        document.getElementById("contracted-next-payment").value || null,
      price: parseFloat(document.getElementById("contracted-price").value),
      status: document.getElementById("contracted-status").value,
      invoiceDays:
        parseInt(document.getElementById("contracted-invoice-days").value) ||
        30,
    };

    // Definir URL de la API
    const API_BASE_URL = "http://localhost:5000/api";
    let url = `${API_BASE_URL}/contracted-services`;
    let method = "POST";

    // Si estamos editando, modificar URL y método
    if (isEditing) {
      url = `${API_BASE_URL}/contracted-services/${csId}`;
      method = "PUT";
    }

    // Enviar datos a la API
    const result = await fetchWithAuth(url, method, csData);

    // Procesar respuesta
    if (result) {
      // Mostrar mensaje de éxito
      const successMessage = isEditing
        ? "Servicio contratado actualizado exitosamente"
        : "Servicio contratado creado exitosamente";
      showToast("success", successMessage, "");

      // Cerrar modal y recargar datos
      closeModal("contracted-service-modal");
      await loadContractedServicesData();

      // Recargar otras secciones si existen
      if (typeof loadDashboardData === "function") loadDashboardData();
      if (typeof loadCalendarData === "function") loadCalendarData();
    }
  } catch (error) {
    console.error("Error guardando servicio contratado:", error);
    showToast("error", "Error", "No se pudo guardar el servicio contratado");
  } finally {
    // Restaurar estado del botón
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

async function confirmDeleteContractedServiceAPI(csId) {
  try {
    // El backend se encarga de validar si tiene facturas asociadas
    // Confiamos en que devolverá un error apropiado si no se puede eliminar

    openConfirmModal(
      "Eliminar Servicio Contratado",
      "¿Estás seguro de que deseas eliminar este servicio contratado? Esta acción no se puede deshacer.",
      async () => {
        try {
          // Mostrar indicador de carga
          showToast("info", "Procesando", "Eliminando servicio contratado...");

          // Realizar petición a la API para eliminar el servicio contratado
          const API_BASE_URL = "http://localhost:5000/api";
          const result = await fetchWithAuth(
            `${API_BASE_URL}/contracted-services/${csId}`,
            "DELETE"
          );

          // Mostrar mensaje de éxito
          showToast(
            "success",
            "Servicio contratado eliminado exitosamente",
            ""
          );

          // Recargar datos
          await loadContractedServicesData();

          // Recargar otras secciones si existen
          if (typeof loadDashboardData === "function") loadDashboardData();
          if (typeof loadCalendarData === "function") loadCalendarData();
        } catch (error) {
          console.error("Error eliminando servicio contratado:", error);

          // Mostrar mensaje específico si tiene facturas asociadas
          if (
            error.message &&
            (error.message.includes("facturas") ||
              error.message.includes("invoices") ||
              error.message.includes("asociadas") ||
              error.message.includes("being used"))
          ) {
            showToast(
              "error",
              "No se puede eliminar",
              "Este servicio contratado tiene facturas asociadas"
            );
          } else {
            showToast(
              "error",
              "Error",
              "No se pudo eliminar el servicio contratado"
            );
          }
        }
      }
    );
  } catch (error) {
    console.error("Error al intentar eliminar servicio contratado:", error);
    showToast("error", "Error", "No se pudo procesar la solicitud");
  }
}

// Implementación de exportContractedServicesToExcel (ya declarada al inicio del archivo)
exportContractedServicesToExcel = async function() {
  try {
    showToast("info", "Procesando", "Preparando archivo de Excel...");

    // Obtener servicios contratados de la API
    let result;
    try {
      result = await fetchWithAuth(`${API_BASE_URL}/contracted-services?include=client,service`);
    } catch (corsError) {
      console.log("Error CORS al cargar con include, intentando sin include:", corsError);
      result = await fetchWithAuth(`${API_BASE_URL}/contracted-services`);
    }

    const contractedServices = result.data || [];

    if (contractedServices.length === 0) {
      showToast("warning", "Sin datos", "No hay servicios contratados para exportar");
      return;
    }

    // Preparar datos para Excel
    let excelData = [
      [
        "Cliente",
        "Servicio",
        "Tipo de Pago",
        "Fecha Inicio",
        "Próximo Pago",
        "Precio",
        "Estado",
        "Días para Vencimiento",
        "Observaciones"
      ],
    ];

    contractedServices.forEach((contractedService) => {
      // Formatear fechas
      const startDate = contractedService.startDate
        ? new Date(contractedService.startDate).toLocaleDateString()
        : "";
      const nextPayment = contractedService.nextPayment
        ? new Date(contractedService.nextPayment).toLocaleDateString()
        : "";

      // Calcular días para vencimiento
      let daysToExpire = "";
      if (contractedService.nextPayment) {
        const today = new Date();
        const paymentDate = new Date(contractedService.nextPayment);
        const diffTime = paymentDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysToExpire = diffDays;
      }

      // Obtener nombres de cliente y servicio
      const clientName = contractedService.Client?.name || 
                        contractedService.clientName || 
                        `Cliente ID ${contractedService.clientId}`;
      const serviceName = contractedService.Service?.name || 
                         contractedService.serviceName || 
                         `Servicio ID ${contractedService.serviceId}`;

      // Formatear precio
      const price = contractedService.price ? `S/ ${parseFloat(contractedService.price).toFixed(2)}` : "";

      excelData.push([
        clientName,
        serviceName,
        contractedService.Service?.type || contractedService.type || "",
        startDate,
        nextPayment,
        price,
        contractedService.status,
        daysToExpire,
        contractedService.observations || ""
      ]);
    });

    // Crear workbook utilizando XLSX
    const wb = XLSX.utils.book_new();
    
    // Crear worksheet desde los datos
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Configurar ancho de columnas para mejor visualización
    const colWidths = [
      { wch: 5 },   // ID
      { wch: 25 },  // Cliente
      { wch: 30 },  // Servicio
      { wch: 15 },  // Tipo de Pago
      { wch: 15 },  // Fecha Inicio
      { wch: 15 },  // Próximo Pago
      { wch: 12 },  // Precio
      { wch: 12 },  // Estado
      { wch: 10 },  // Días para Vencimiento
      { wch: 35 }   // Observaciones
    ];
    ws['!cols'] = colWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, "Servicios Contratados");
    
    // Generar nombre de archivo con fecha actual
    const fileName = `Servicios_Contratados_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, fileName);
    
    showToast(
      "success",
      "Exportación completa",
      `${contractedServices.length} servicios contratados exportados a ${fileName}`
    );
    console.log("Datos exportados para Excel:", excelData);
  } catch (error) {
    console.error("Error exportando servicios contratados:", error);
    showToast("error", "Error", "No se pudo exportar los servicios contratados");
  }
}

// Funciones de Servicios (Catálogo)
// Implementación de loadServicesData (ya declarada al inicio del archivo)
loadServicesData = async function() {
  try {
    const servicesGrid = document.getElementById("services-grid");
    if (!servicesGrid) return;

    // Mostrar indicador de carga
    servicesGrid.innerHTML =
      '<div class="text-center p-4">Cargando servicios...</div>';

    // Definir API URL
    const API_BASE_URL = "http://localhost:5000/api";

    // Cargar servicios y servicios contratados en paralelo para mayor eficiencia
    const [servicesResult, contractedServicesResult] = await Promise.all([
      fetchWithAuth(`${API_BASE_URL}/services`),
      fetchWithAuth(`${API_BASE_URL}/contracted-services?status=activo`),
    ]);

    // Verificar que la respuesta contiene datos
    if (!servicesResult.data) {
      servicesGrid.innerHTML =
        '<div class="alert alert-warning">No se encontraron servicios</div>';
      return;
    }

    const services = servicesResult.data;
    const contractedServices = contractedServicesResult.data || [];

    // Limpiar contenedor
    servicesGrid.innerHTML = "";

    // Renderizar tarjetas de servicios
    services.forEach((service) => {
      const card = document.createElement("div");
      card.className = "service-card";

      // Contar clientes activos que tienen este servicio contratado
      const clientsCount = contractedServices.filter(
        (cs) =>
          cs.serviceId === service.id ||
          (cs.service && cs.service.id === service.id)
      ).length;

      // Determinar tipo de servicio
      const serviceTypeClass =
        service.type === "mensual" ? "service-monthly" : "service-temporal";
      const serviceTypeText =
        service.type === "mensual" ? "Suscripción Mensual" : "Pago Único";

      // Formatear fecha de creación
      const createdAt = service.createdAt
        ? new Date(service.createdAt).toLocaleDateString()
        : "N/A";

      // Formatear precio de forma segura
      const formatPrice = (price) => {
        if (!price) return "0.00";
        if (typeof price === "number") return price.toFixed(2);
        const parsed = parseFloat(price);
        return isNaN(parsed) ? "0.00" : parsed.toFixed(2);
      };

      // Generar HTML de la tarjeta
      card.innerHTML = `
                <div class="service-header">
                    <div>
                        <div class="service-type ${serviceTypeClass}">${serviceTypeText}</div>
                        <div class="service-name">${service.name}</div>
                    </div>
                    <div class="table-actions">
                        <div class="action-btn edit-btn" onclick="openServiceModal(${
                          service.id
                        })">
                            <i class="fas fa-edit"></i>
                        </div>
                        <div class="action-btn delete-btn" onclick="confirmDeleteService(${
                          service.id
                        })">
                            <i class="fas fa-trash"></i>
                        </div>
                    </div>
                </div>
                <div class="service-price">S/. ${formatPrice(
                  service.price
                )}</div>
                <div class="service-description">${
                  service.description || ""
                }</div>
                <div class="service-info">Clientes activos: ${clientsCount}</div>
                <div class="service-info">Creado el: ${createdAt}</div>
            `;

      servicesGrid.appendChild(card);
    });

    // Si no hay servicios, mostrar mensaje
    if (services.length === 0) {
      servicesGrid.innerHTML =
        '<div class="alert alert-info text-center">No hay servicios registrados</div>';
    }
  } catch (error) {
    console.error("Error cargando servicios:", error);
    const servicesGrid = document.getElementById("services-grid");
    if (servicesGrid) {
      servicesGrid.innerHTML =
        '<div class="alert alert-danger text-center">Error al cargar servicios</div>';
    }
    showToast("error", "Error", "No se pudieron cargar los servicios");
  }
}

// Implementación de openServiceModal (ya declarada al inicio del archivo)
openServiceModal = async function(serviceId = null) {
  try {
    const form = document.getElementById("service-form");
    const modalTitle = document.getElementById("service-modal-title");
    if (!form || !modalTitle) return;

    // Resetear formulario
    form.reset();
    document.getElementById("service-id").value = "";

    // Preparar modal para edición o nuevo servicio
    if (serviceId) {
      modalTitle.textContent = "Editar Servicio";

      // Mostrar indicadores de carga
      const loadingFields = ["name", "type", "price", "description"];
      loadingFields.forEach((field) => {
        document.getElementById(`service-${field}`).value = "Cargando...";
      });

      // Realizar petición a la API para obtener datos del servicio
      const API_BASE_URL = "http://localhost:5000/api";
      const result = await fetchWithAuth(
        `${API_BASE_URL}/services/${serviceId}`
      );

      if (result.data) {
        const service = result.data;
        // Completar formulario con datos del servicio
        document.getElementById("service-id").value = service.id;
        document.getElementById("service-name").value = service.name;
        document.getElementById("service-type").value = service.type;
        document.getElementById("service-price").value = service.price;
        document.getElementById("service-description").value =
          service.description || "";
      }
    } else {
      modalTitle.textContent = "Nuevo Servicio";
    }

    // Mostrar el modal
    showModal("service-modal");
  } catch (error) {
    console.error("Error al abrir modal de servicio:", error);
    showToast("error", "Error", "No se pudieron cargar los datos del servicio");

    // Limpiar campos en caso de error
    const fields = ["name", "type", "price", "description"];
    fields.forEach((field) => {
      document.getElementById(`service-${field}`).value = "";
    });

    // Mostrar el modal a pesar del error (para permitir crear un nuevo servicio)
    showModal("service-modal");
  }
}

// Implementación de handleServiceSubmit (ya declarada al inicio del archivo)
handleServiceSubmit = async function(event) {
  event.preventDefault();

  // Mostrar indicador de carga en el botón de submit
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Guardando...";

  try {
    // Obtener datos del formulario
    const serviceId = document.getElementById("service-id").value;
    const isEditing = serviceId !== "";

    // Preparar datos del servicio para enviar a la API
    const serviceData = {
      name: document.getElementById("service-name").value,
      type: document.getElementById("service-type").value,
      price: parseFloat(document.getElementById("service-price").value),
      description: document.getElementById("service-description").value,
    };

    // Para servicios nuevos, agregar fecha de creación
    if (!isEditing) {
      serviceData.createdAt = new Date().toISOString();
    }

    // Definir URL de la API
    const API_BASE_URL = "http://localhost:5000/api";
    let url = `${API_BASE_URL}/services`;
    let method = "POST";

    // Si estamos editando, modificar URL y método
    if (isEditing) {
      url = `${API_BASE_URL}/services/${serviceId}`;
      method = "PUT";
    }

    // Enviar datos a la API
    const result = await fetchWithAuth(url, method, serviceData);

    // Procesar respuesta
    if (result) {
      // Mostrar mensaje de éxito
      const successMessage = isEditing
        ? "Servicio actualizado exitosamente"
        : "Servicio creado exitosamente";
      showToast("success", successMessage, "");

      // Cerrar modal y recargar datos
      closeModal("service-modal");
      await loadServicesData();
    }
  } catch (error) {
    console.error("Error guardando servicio:", error);
    showToast("error", "Error", "No se pudo guardar el servicio");
  } finally {
    // Restaurar estado del botón
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
}

async function confirmDeleteService(serviceId) {
  try {
    // En lugar de verificar manualmente si el servicio está en uso,
    // confiamos en que el backend hará esta validación y devolverá un error apropiado

    openConfirmModal(
      "Eliminar Servicio",
      "¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.",
      async () => {
        try {
          // Mostrar indicador de carga
          showToast("info", "Procesando", "Eliminando servicio...");

          // Realizar petición a la API para eliminar el servicio
          const API_BASE_URL = "http://localhost:5000/api";
          const result = await fetchWithAuth(
            `${API_BASE_URL}/services/${serviceId}`,
            "DELETE"
          );

          // Mostrar mensaje de éxito
          showToast("success", "Servicio eliminado exitosamente", "");

          // Recargar datos
          await loadServicesData();
        } catch (error) {
          console.error("Error eliminando servicio:", error);

          // Mostrar mensaje específico si el servicio está en uso
          if (
            error.message &&
            (error.message.includes("en uso") ||
              error.message.includes("being used") ||
              error.message.includes("contratados"))
          ) {
            showToast(
              "error",
              "No se puede eliminar",
              "Hay clientes que tienen este servicio contratado"
            );
          } else {
            showToast("error", "Error", "No se pudo eliminar el servicio");
          }
        }
      }
    );
  } catch (error) {
    console.error("Error al intentar eliminar servicio:", error);
    showToast("error", "Error", "No se pudo procesar la solicitud");
  }
}

// Implementación de exportServicesToExcel (ya declarada al inicio del archivo)
exportServicesToExcel = async function() {
  try {
    showToast("info", "Procesando", "Preparando archivo de Excel...");

    // Obtener todos los servicios de la API
    const result = await fetchWithAuth(`${API_BASE_URL}/services`);
    const services = result.data || [];

    if (services.length === 0) {
      showToast("warning", "Sin datos", "No hay servicios para exportar");
      return;
    }

    // Preparar datos para Excel
    let excelData = [
      [
        "ID",
        "Nombre",
        "Tipo",
        "Precio",
        "Descripción",
        "Fecha de Creación"
      ],
    ];

    services.forEach((service) => {
      // Formatear fecha de creación
      const createdAt = service.createdAt
        ? new Date(service.createdAt).toLocaleDateString()
        : "";

      // Formatear precio
      const price = service.price ? `S/ ${parseFloat(service.price).toFixed(2)}` : "";

      excelData.push([
        service.id,
        service.name,
        service.type,
        price,
        service.description || "",
        createdAt
      ]);
    });

    // Crear workbook utilizando XLSX
    const wb = XLSX.utils.book_new();
    
    // Crear worksheet desde los datos
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Configurar ancho de columnas para mejor visualización
    const colWidths = [
      { wch: 5 },   // ID
      { wch: 35 },  // Nombre
      { wch: 12 },  // Tipo
      { wch: 12 },  // Precio
      { wch: 50 },  // Descripción
      { wch: 15 }   // Fecha de Creación
    ];
    ws['!cols'] = colWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, "Servicios");
    
    // Generar nombre de archivo con fecha actual
    const fileName = `Servicios_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, fileName);
    
    showToast(
      "success",
      "Exportación completa",
      `${services.length} servicios exportados a ${fileName}`
    );
    console.log("Datos exportados para Excel:", excelData);
  } catch (error) {
    console.error("Error exportando servicios:", error);
    showToast("error", "Error", "No se pudo exportar los servicios");
  }
}

// Funciones de Proformas (Invoices)
// Implementación de loadInvoicesData (variable declarada al inicio del archivo)
loadInvoicesData = async function() {
  try {
    // Configurar event listener del botón de exportar como respaldo
    setTimeout(() => {
      const exportButton = document.getElementById("export-invoices-btn");
      if (exportButton && !exportButton.hasAttribute("data-listener-added")) {
        exportButton.addEventListener("click", exportInvoicesToExcel);
        exportButton.setAttribute("data-listener-added", "true");
        console.log("✅ DEBUG: Event listener agregado al botón (desde loadInvoicesData)");
      }
    }, 100);

    // Mostrar indicador de carga
    const tableBody = document.querySelector("#invoices-table tbody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="11" class="text-center p-4">Cargando facturas...</td></tr>';
    }

    // Realizar petición a la API para obtener facturas
    // Intentar primero con include, si falla, intentar sin include
    let result;
    try {
      console.log('Cargando facturas con include=client,service,payments...');
      result = await fetchWithAuth(`${API_BASE_URL}/invoices?include=client,service,payments`);
      console.log('Respuesta exitosa con include. Datos:', result);
    } catch (corsError) {
      console.log("Error CORS al cargar con include, intentando sin include:", corsError);
      result = await fetchWithAuth(`${API_BASE_URL}/invoices`);
      console.log('Respuesta sin include. Datos:', result);
    }

    // Verificar que la respuesta contiene datos
    if (!result.data) {
      console.log('No se encontraron datos en la respuesta:', result);
      filteredInvoices = [];
      if (tableBody) {
        tableBody.innerHTML =
          '<tr><td colspan="11" class="text-center">No se encontraron facturas</td></tr>';
      }
      return;
    }

    // Debug: Verificar estructura de datos
    console.log('Total de facturas recibidas:', result.data.length);
    if (result.data.length > 0) {
      console.log('Ejemplo de primera factura:', result.data[0]);
      console.log('¿La primera factura tiene payments?', result.data[0].payments);
    }

    // Actualizar variable global con datos de la API
    filteredInvoices = [...result.data];

    // Cargar opciones de filtros y renderizar tabla
    await loadInvoiceFilterOptions();
    renderInvoicesTable();
    updateInvoicePagination();
  } catch (error) {
    console.error("Error cargando facturas:", error);
    filteredInvoices = [];
    const tableBody = document.querySelector("#invoices-table tbody");
    if (tableBody) {
      tableBody.innerHTML =
        '<tr><td colspan="11" class="text-center text-danger">Error al cargar facturas</td></tr>';
    }
    showToast("error", "Error", "No se pudieron cargar las facturas");
  }
}

async function loadInvoiceFilterOptions() {
  try {
    // Cargar clientes y servicios en paralelo para los filtros
    const [clientsResult, servicesResult] = await Promise.all([
      fetchWithAuth(`${API_BASE_URL}/clients?status=activo`),
      fetchWithAuth(`${API_BASE_URL}/services`),
    ]);

    const clientFilter = document.getElementById("invoice-client-filter");
    const serviceFilter = document.getElementById("invoice-service-filter");

    if (clientFilter && clientsResult.data) {
      clientFilter.innerHTML = '<option value="">Todos</option>';
      clientsResult.data.forEach((client) =>
        clientFilter.add(new Option(client.name, client.id))
      );
    }

    if (serviceFilter && servicesResult.data) {
      serviceFilter.innerHTML = '<option value="">Todos</option>';
      servicesResult.data.forEach((service) =>
        serviceFilter.add(new Option(service.name, service.id))
      );
    }
  } catch (error) {
    console.error("Error cargando opciones de filtro para facturas:", error);
    // Mantener opciones básicas en caso de error
    const clientFilter = document.getElementById("invoice-client-filter");
    const serviceFilter = document.getElementById("invoice-service-filter");
    if (clientFilter)
      clientFilter.innerHTML = '<option value="">Todos</option>';
    if (serviceFilter)
      serviceFilter.innerHTML = '<option value="">Todos</option>';
  }
}

// Esta función ha sido movida al principio del archivo para estar disponible antes de su uso
// Ver la implementación en la sección de "Implementaciones de funciones de paginación"

// Función para manejar los datos de la proforma y mostrarlos en el modal
async function handleInvoiceData(invoice, eventTitleEl, eventDetailsEl) {
  console.log('🔍 DEBUG handleInvoiceData - Iniciando con:', {
    invoice: invoice,
    eventTitleEl: !!eventTitleEl,
    eventDetailsEl: !!eventDetailsEl
  });

  if (!invoice) {
    console.log('🔍 DEBUG handleInvoiceData - Factura no encontrada');
    showToast("error", "Error", "Proforma no encontrada");
    closeModal("event-modal");
    return;
  }

  // Verificar que se incluyeron client y service
  let client = invoice.Client || invoice.client;
  let service = invoice.Service || invoice.service;
  console.log('🔍 DEBUG handleInvoiceData - Client:', client, 'Service:', service);
  console.log('🔍 DEBUG handleInvoiceData - Invoice completa:', {
    id: invoice.id,
    clientId: invoice.clientId,
    serviceId: invoice.serviceId,
    hasClientProperty: 'client' in invoice,
    hasClientCapitalProperty: 'Client' in invoice,
    clientValue: invoice.client,
    ClientValue: invoice.Client
  });
  
  // Si no hay client o service, cargarlos por separado
  if (!client && invoice.clientId) {
    console.log('🔍 DEBUG handleInvoiceData - Cargando cliente por separado...');
    try {
      client = await fetchWithAuth(`${API_BASE_URL}/clients/${invoice.clientId}`);
      client = client.data || client;
      console.log('🔍 DEBUG handleInvoiceData - Cliente cargado:', client);
    } catch (error) {
      console.error('Error cargando cliente:', error);
    }
  }
  
  if (!service && invoice.serviceId) {
    console.log('🔍 DEBUG handleInvoiceData - Cargando servicio por separado...');
    try {
      service = await fetchWithAuth(`${API_BASE_URL}/services/${invoice.serviceId}`);
      service = service.data || service;
      console.log('🔍 DEBUG handleInvoiceData - Servicio cargado:', service);
    } catch (error) {
      console.error('Error cargando servicio:', error);
    }
  }
  
  // Si no se pueden cargar cliente o servicio, usar datos de fallback
  if (!client) {
    console.log('🔍 DEBUG handleInvoiceData - Cliente no disponible, usando fallback');
    client = {
      name: `Cliente ID ${invoice.clientId} (No encontrado en base de datos)`,
      phone: 'No disponible',
      email: 'No disponible',
      ruc: 'No disponible'
    };
  }
  
  if (!service) {
    console.log('🔍 DEBUG handleInvoiceData - Servicio no disponible, usando fallback');
    service = {
      name: `Servicio ID ${invoice.serviceId}`,
      description: 'Información no disponible'
    };
  }

  // Calcular estado de vencimiento
  const dueDate = new Date(invoice.dueDate);
  const currentDate = new Date();
  const daysUntilDue = Math.ceil(
    (dueDate - currentDate) / (1000 * 60 * 60 * 24)
  );
  // Convertir a números para cálculos
  const totalAmount = typeof invoice.amount === 'number' ? invoice.amount : parseFloat(invoice.amount) || 0;
  const paidAmount = typeof invoice.paidAmount === 'number' ? invoice.paidAmount : parseFloat(invoice.paidAmount) || 0;
  const pendingAmount = totalAmount - paidAmount;
  let dueStatus = "";
  if (invoice.status === "pagada") dueStatus = "Pagada";
  else if (daysUntilDue < 0) dueStatus = "Vencida";
  else if (daysUntilDue <= 5)
    dueStatus = `Vence en ${daysUntilDue} días (urgente)`;
  else if (daysUntilDue <= 10)
    dueStatus = `Vence en ${daysUntilDue} días (próximo)`;
  else dueStatus = `Vence en ${daysUntilDue} días`;

  // Información del documento
  const documentInfo = invoice.document
    ? `<p><strong>Documento:</strong> ${invoice.document.name}</p>`
    : '<p><strong>Documento:</strong> <span class="text-muted">Sin documento</span></p>';

  // Información de pagos
  let paymentsInfo = "";
  const payments = invoice.payments || invoice.Payments || [];
  if (payments.length > 0) {
    paymentsInfo = `
              <h4>Pagos Registrados</h4>
              <div style="margin-bottom: 15px">
                  <p><strong>Total pagado:</strong> S/. ${paidAmount.toFixed(
                    2
                  )}</p>
                  <p><strong>Pendiente:</strong> S/. ${pendingAmount.toFixed(
                    2
                  )}</p>
              </div>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                  <tr style="background-color: rgba(0,0,0,0.05);">
                      <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border-color);">Fecha</th>
                      <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border-color);">Monto</th>
                      <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border-color);">Método</th>
                      <th style="padding:8px;text-align:left;border-bottom:1px solid var(--border-color);">Voucher</th>
                  </tr>`;

    payments.forEach((payment) => {
      const voucherInfo = payment.voucher
        ? `<i class="fas fa-file-alt"></i> ${payment.voucher.name}`
        : '<span class="text-muted">Sin voucher</span>';
      // Convertir amount a número
      const paymentAmount = typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount) || 0;
      paymentsInfo += `
                  <tr>
                      <td style="padding:8px;border-bottom:1px solid var(--border-color);">${new Date(
                        payment.date
                      ).toLocaleDateString()}</td>
                      <td style="padding:8px;border-bottom:1px solid var(--border-color);">S/. ${paymentAmount.toFixed(
                        2
                      )}</td>
                      <td style="padding:8px;border-bottom:1px solid var(--border-color);">${capitalizeFirstLetter(
                        payment.method
                      )}</td>
                      <td style="padding:8px;border-bottom:1px solid var(--border-color);">${voucherInfo}</td>
                  </tr>`;
    });
    paymentsInfo += `</table>`;
  }

  // Preparar detalles completos
  // Verificar si estamos usando datos de fallback
  const usingClientFallback = client.name.includes('Cliente ID');
  const usingServiceFallback = service.name.includes('Servicio ID');
  
  let warningMessage = '';
  if (usingClientFallback || usingServiceFallback) {
    warningMessage = `
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
        <strong>⚠️ Advertencia:</strong> Algunos datos no pudieron cargarse desde el servidor.
        ${usingClientFallback ? '<br>• Información del cliente no disponible' : ''}
        ${usingServiceFallback ? '<br>• Información del servicio no disponible' : ''}
      </div>
    `;
  }

  const details = `
          <h3>Detalles de pago</h3>
          ${warningMessage}
          <p><strong>Número:</strong> ${invoice.number}</p>
          <p><strong>Tipo:</strong> ${
            invoice.documentType === "factura"
              ? "Factura"
              : "Recibo por Honorario Electrónico"
          }</p>
          <p><strong>Cliente:</strong> ${client.name}</p>
          <p><strong>RUC/DNI:</strong> ${client.ruc || "No especificado"}</p>
          <p><strong>Servicio:</strong> ${service.name}</p>
          <p><strong>F.Emisión:</strong> ${new Date(
            invoice.issueDate
          ).toLocaleDateString()}</p>
          <p><strong>F.Vencimiento:</strong> ${new Date(
            invoice.dueDate
          ).toLocaleDateString()}</p>
          <p><strong>Estado:</strong> ${dueStatus}</p>
          <p><strong>M.Total:</strong> S/. ${totalAmount.toFixed(2)}</p>
          <p><strong>M.Pagado:</strong> S/. ${paidAmount.toFixed(
            2
          )}</p>
          <p><strong>M.Pendiente:</strong> S/. ${pendingAmount.toFixed(2)}</p>
          ${documentInfo}
          ${paymentsInfo}
          <div class="action-buttons" style="margin-top:20px;">
              <button class="btn btn-success" onclick="sendInvoiceByWhatsApp(${
                invoice.id
              })">
                <i class="fab fa-whatsapp"></i> Enviar por WhatsApp
              </button>
              ${
                invoice.document
                  ? `<button class="btn btn-info" onclick="downloadInvoiceDocument(${invoice.id})">
                      <i class="fas fa-download"></i> Descargar Documento
                    </button>`
                  : ""
              }
              <button class="btn btn-primary" onclick="openInvoiceModal(${
                invoice.id
              })">
                <i class="fas fa-edit"></i> Editar Proforma
              </button>
              <button class="btn btn-warning" onclick="openPartialPaymentModal(${
                invoice.id
              })">
                <i class="fas fa-money-bill-wave"></i> Registrar Pago
              </button>
          </div>`;

  // Actualizar modal con los datos
  console.log('🔍 DEBUG handleInvoiceData - Actualizando modal con datos...');
  if (eventTitleEl) eventTitleEl.textContent = `Historial de pago: ${invoice.number}`;
  if (eventDetailsEl) eventDetailsEl.innerHTML = details;
  console.log('🔍 DEBUG handleInvoiceData - Modal actualizado exitosamente');
}

async function downloadInvoiceDocument(invoiceId) {
  try {
    // Cargar datos de la factura desde la API
    const invoice = await fetchWithAuth(
      `${API_BASE_URL}/invoices/${invoiceId}`
    );
    if (!invoice) {
      showToast("error", "Error", "Proforma no encontrada");
      return;
    }

    if (invoice.document) {
      // Si ya tiene documento, descargarlo
      showToast("success", "Descarga", `Descargando: ${invoice.document.name}`);
      // Aquí se implementaría la descarga real del documento
      // window.open(`${API_BASE_URL}/invoices/${invoiceId}/document`, '_blank');
    } else {
      // Si no tiene documento, generar PDF
      await generateInvoicePDF(invoice);
    }
  } catch (error) {
    console.error("Error al descargar documento:", error);
    showToast("error", "Error", "No se pudo descargar el documento");
  }
}

async function generateInvoicePDF(invoice) {
  try {
    // Si no se pasó la factura completa, cargarla desde API
    if (!invoice.Client && !invoice.client) {
      invoice = await fetchWithAuth(
        `${API_BASE_URL}/invoices/${invoice.id}`
      );
    }

    const client = invoice.Client || invoice.client;
    const service = invoice.Service || invoice.service;

    if (!client || !service) {
      showToast("error", "Error", "Error al generar documento");
      return;
    }

    const documentType = invoice.documentType === "factura" ? "Factura" : "RHE";
    const pdfName = `${documentType}_${invoice.number}_${client.name.replace(
      /\s+/g,
      "_"
    )}.pdf`;

    showToast("info", "Generando", `Generando PDF: ${pdfName}`);

    // Llamar al endpoint de generación de PDF
    const result = await fetchWithAuth(
      `${API_BASE_URL}/invoices/${invoice.id}/generate-pdf`,
      "POST"
    );

    if (result && result.documentUrl) {
      // Descargar el PDF generado
      window.open(result.documentUrl, "_blank");
      showToast(
        "success",
        "PDF Generado",
        `PDF generado y descargado: ${pdfName}`
      );
    } else {
      // Simulación temporal hasta implementar el backend
      setTimeout(() => {
        showToast(
          "success",
          "PDF Generado",
          `PDF generado: ${pdfName} (simulado)`
        );
      }, 1000);
    }
  } catch (error) {
    console.error("Error generando PDF:", error);
    showToast("error", "Error", "No se pudo generar el PDF");
  }
}

// Esta función ha sido movida al principio del archivo para evitar errores de referencia
// Ver la implementación en la sección de "Funciones de Facturas y Pagos"

// Esta función ha sido movida al principio del archivo para estar disponible antes de su uso
// Ver la implementación en la sección de "Implementaciones de funciones de paginación"

// Esta función ha sido movida al principio del archivo para estar disponible antes de su uso
// Ver la implementación en la sección de "Implementaciones de funciones de paginación"

// Implementación de applyInvoiceFilters (ya declarada al inicio del archivo)
applyInvoiceFilters = async function() {
  try {
    const clientFilter = document.getElementById(
      "invoice-client-filter"
    )?.value;
    const serviceFilter = document.getElementById(
      "invoice-service-filter"
    )?.value;
    const statusFilter = document.getElementById(
      "invoice-status-filter"
    )?.value;
    const dateFilter = document.getElementById("invoice-date-filter")?.value;

    // Construir parámetros de filtro para la API
    const params = new URLSearchParams();
    // Intentar usar include, pero manejar la posibilidad de errores CORS
    try {
      params.append("include", "client,service,payments");
    } catch (error) {
      console.log("No se pudo añadir parámetro include, continuando sin él");
    }

    if (clientFilter) params.append("clientId", clientFilter);
    if (serviceFilter) params.append("serviceId", serviceFilter);
    if (statusFilter) params.append("status", statusFilter);
    if (dateFilter) {
      const [year, month] = dateFilter.split("-");
      params.append("year", year);
      params.append("month", month);
    }

    // Cargar facturas filtradas desde la API
    console.log('Aplicando filtros con URL:', `${API_BASE_URL}/invoices?${params.toString()}`);
    const result = await fetchWithAuth(
      `${API_BASE_URL}/invoices?${params.toString()}`
    );

    console.log('Resultado de filtros:', result);
    
    if (result && result.data) {
      filteredInvoices = result.data;
      console.log('Facturas filtradas:', filteredInvoices.length);
      if (filteredInvoices.length > 0) {
        console.log('Ejemplo de factura filtrada:', filteredInvoices[0]);
      }
      currentInvoicePage = 1;
      renderInvoicesTable();
      updateInvoicePagination();
    } else if (result) {
      // Si la respuesta no tiene .data, usar directamente el resultado
      filteredInvoices = result;
      console.log('Facturas filtradas (sin .data):', filteredInvoices.length);
      currentInvoicePage = 1;
      renderInvoicesTable();
      updateInvoicePagination();
    }
  } catch (error) {
    console.error("Error aplicando filtros de facturas:", error);
    showToast("error", "Error", "No se pudieron aplicar los filtros");
  }
}

// Implementación duplicada eliminada - ahora está en sección temprana

async function generateInvoiceNumber() {
  const invoiceNumberEl = document.getElementById("invoice-number");
  if (!invoiceNumberEl) return;

  try {
    // Obtener todas las facturas desde la API (incluidas las eliminadas)
    const result = await fetchWithAuth(`${API_BASE_URL}/invoices?includeDeleted=true`);
    const invoices = result?.data || result || [];
    
    if (!invoices || invoices.length === 0) {
      // No hay facturas, empezar con F001-001
      invoiceNumberEl.value = "F001-001";
      return;
    }

    // Encontrar el número más alto
    let maxNumber = 0;
    let series = "F001";
    
    invoices.forEach(invoice => {
      if (invoice.number) {
        const parts = invoice.number.split("-");
        if (parts.length === 2) {
          const currentSeries = parts[0];
          const currentNumber = parseInt(parts[1]);
          
          if (currentSeries === series && !isNaN(currentNumber) && currentNumber > maxNumber) {
            maxNumber = currentNumber;
          }
        }
      }
    });
    
    // Generar el siguiente número
    const nextNumber = maxNumber + 1;
    const generatedNumber = `${series}-${nextNumber.toString().padStart(3, "0")}`;
    
    console.log("🔍 DEBUG generateInvoiceNumber:", {
      totalInvoices: invoices.length,
      maxNumber,
      nextNumber,
      generatedNumber,
      existingNumbers: invoices.map(i => i.number)
    });
    
    invoiceNumberEl.value = generatedNumber;
    
  } catch (error) {
    console.error("Error generando número de factura:", error);
    // Fallback en caso de error
    invoiceNumberEl.value = "F001-001";
  }
}

// Implementación duplicada eliminada - ahora está en sección temprana

// Esta función ha sido movida al principio del archivo para evitar errores de referencia
// Ver la implementación en la sección de "Funciones de Facturas y Pagos"

// Esta función ha sido movida al principio del archivo para evitar errores de referencia
// Ver la implementación en la sección de "Funciones de Facturas y Pagos"

// Esta función se ha movido al principio del archivo para evitar errores de referencia
// Ver la implementación al inicio del archivo

// Implementación de exportInvoicesToExcel (ya declarada al inicio del archivo)
exportInvoicesToExcel = async function() {
  try {
    console.log("🔍 DEBUG: Iniciando exportación de proformas...");
    console.log("🔍 DEBUG: Función exportInvoicesToExcel ejecutada correctamente");
    showToast("info", "Procesando", "Preparando archivo de Excel...");

    // Obtener todas las proformas de la API
    let result;
    try {
      result = await fetchWithAuth(`${API_BASE_URL}/invoices?include=client,service`);
    } catch (corsError) {
      console.log("Error CORS al cargar con include, intentando sin include:", corsError);
      result = await fetchWithAuth(`${API_BASE_URL}/invoices`);
    }

    const invoices = result.data || [];

    if (invoices.length === 0) {
      showToast("warning", "Sin datos", "No hay proformas para exportar");
      return;
    }

    // Preparar datos para Excel
    let excelData = [
      [
        "N° Documento",
        "Cliente",
        "Servicio",
        "Tipo Documento",
        "Fecha Emisión",
        "Fecha Vencimiento",
        "Monto",
        "Pagado",
        "Pendiente",
        "Estado",
        "Días Vencimiento"
      ],
    ];

    invoices.forEach((invoice) => {
      // Formatear fechas
      const issueDate = invoice.issueDate
        ? new Date(invoice.issueDate).toLocaleDateString()
        : "";
      const dueDate = invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString()
        : "";

      // Calcular días desde vencimiento
      let daysOverdue = "";
      if (invoice.dueDate && invoice.status !== "pagada") {
        const today = new Date();
        const dueDateObj = new Date(invoice.dueDate);
        const diffTime = today - dueDateObj;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysOverdue = diffDays > 0 ? diffDays : 0;
      }

      // Obtener nombres de cliente y servicio
      const clientName = invoice.Client?.name || 
                        invoice.clientName || 
                        `Cliente ID ${invoice.clientId}`;
      const serviceName = invoice.Service?.name || 
                         invoice.serviceName || 
                         `Servicio ID ${invoice.serviceId}`;

      // Formatear montos
      const amount = invoice.amount ? `S/ ${parseFloat(invoice.amount).toFixed(2)}` : "";
      const paidAmount = invoice.paidAmount ? `S/ ${parseFloat(invoice.paidAmount).toFixed(2)}` : "S/ 0.00";
      const pendingAmount = invoice.amount && invoice.paidAmount 
        ? `S/ ${(parseFloat(invoice.amount) - parseFloat(invoice.paidAmount)).toFixed(2)}`
        : amount;

      excelData.push([
        invoice.number || "",
        clientName,
        serviceName,
        invoice.documentType || "factura",
        issueDate,
        dueDate,
        amount,
        paidAmount,
        pendingAmount,
        invoice.status,
        daysOverdue
      ]);
    });

    // Crear workbook utilizando XLSX
    const wb = XLSX.utils.book_new();
    
    // Crear worksheet desde los datos
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Configurar ancho de columnas para mejor visualización
    const colWidths = [
      { wch: 15 },  // N° Documento
      { wch: 25 },  // Cliente
      { wch: 30 },  // Servicio
      { wch: 15 },  // Tipo Documento
      { wch: 15 },  // Fecha Emisión
      { wch: 15 },  // Fecha Vencimiento
      { wch: 12 },  // Monto
      { wch: 12 },  // Pagado
      { wch: 12 },  // Pendiente
      { wch: 12 },  // Estado
      { wch: 10 }   // Días Vencimiento
    ];
    ws['!cols'] = colWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, "Proformas");
    
    // Generar nombre de archivo con fecha actual
    const fileName = `Proformas_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, fileName);
    
    showToast(
      "success",
      "Exportación completa",
      `${invoices.length} proformas exportadas a ${fileName}`
    );
    console.log("Datos exportados para Excel:", excelData);
  } catch (error) {
    console.error("Error exportando proformas:", error);
    showToast("error", "Error", "No se pudo exportar las proformas");
  }
}

// Funciones de Pagos Parciales
// Implementación duplicada eliminada - ahora está en sección temprana

// Implementación de handleVoucherUpload (variable declarada al inicio del archivo)
handleVoucherUpload = function(event) {
  const file = event.target.files[0];
  const voucherPreview = document.getElementById("voucher-preview");
  if (!file || !voucherPreview) return;
  voucherPreview.innerHTML = `<div class="document-item"><i class="fas fa-file-alt"></i><span>${file.name}</span></div>`;
};

// Esta función ha sido movida al principio del archivo para evitar errores de referencia
// Ver la implementación en la sección de "Funciones de Facturas y Pagos"

// Funciones de Calendario
// Esta función ha sido movida al principio del archivo para estar disponible antes de su uso
// Ver la implementación en la sección de implementaciones tempranas

// Esta función ha sido movida al principio del archivo para estar disponible antes de su uso
// Ver la implementación en la sección de implementaciones tempranas

// Esta función ha sido movida al principio del archivo para estar disponible antes de su uso
// Ver la implementación en la sección de implementaciones tempranas

// Implementación de exportCalendarToExcel (ya declarada al inicio del archivo)
exportCalendarToExcel = async function() {
  try {
    showToast("info", "Procesando", "Preparando archivo de Excel...");

    // Obtener eventos del calendario (basado en servicios contratados e invoices)
    let contractedServicesResult, invoicesResult;
    
    try {
      contractedServicesResult = await fetchWithAuth(`${API_BASE_URL}/contracted-services?include=client,service`);
      invoicesResult = await fetchWithAuth(`${API_BASE_URL}/invoices?include=client,service`);
    } catch (corsError) {
      console.log("Error CORS al cargar con include, intentando sin include:", corsError);
      contractedServicesResult = await fetchWithAuth(`${API_BASE_URL}/contracted-services`);
      invoicesResult = await fetchWithAuth(`${API_BASE_URL}/invoices`);
    }

    const contractedServices = contractedServicesResult.data || [];
    const invoices = invoicesResult.data || [];

    // Preparar datos del calendario
    let calendarEvents = [];

    // Agregar próximos pagos de servicios contratados
    contractedServices.forEach((service) => {
      if (service.nextPayment) {
        const clientName = service.Client?.name || service.clientName || `Cliente ID ${service.clientId}`;
        const serviceName = service.Service?.name || service.serviceName || `Servicio ID ${service.serviceId}`;
        
        calendarEvents.push({
          date: new Date(service.nextPayment),
          type: "Próximo Pago",
          client: clientName,
          service: serviceName,
          amount: service.price ? `S/ ${parseFloat(service.price).toFixed(2)}` : "",
          status: service.status,
          description: `Pago de ${serviceName} para ${clientName}`
        });
      }
    });

    // Agregar vencimientos de facturas pendientes
    invoices.forEach((invoice) => {
      if (invoice.dueDate && invoice.status !== "pagada") {
        const clientName = invoice.Client?.name || invoice.clientName || `Cliente ID ${invoice.clientId}`;
        const serviceName = invoice.Service?.name || invoice.serviceName || `Servicio ID ${invoice.serviceId}`;
        
        calendarEvents.push({
          date: new Date(invoice.dueDate),
          type: "Vencimiento Factura",
          client: clientName,
          service: serviceName,
          amount: invoice.amount ? `S/ ${parseFloat(invoice.amount).toFixed(2)}` : "",
          status: invoice.status,
          description: `Vencimiento de factura ${invoice.number || ''} - ${serviceName}`
        });
      }
    });

    // Ordenar eventos por fecha
    calendarEvents.sort((a, b) => a.date - b.date);

    if (calendarEvents.length === 0) {
      showToast("warning", "Sin datos", "No hay eventos de calendario para exportar");
      return;
    }

    // Preparar datos para Excel
    let excelData = [
      [
        "Fecha",
        "Tipo de Evento",
        "Cliente",
        "Servicio",
        "Monto",
        "Estado",
        "Días Restantes",
        "Descripción"
      ],
    ];

    const today = new Date();
    calendarEvents.forEach((event) => {
      // Calcular días restantes
      const diffTime = event.date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      excelData.push([
        event.date.toLocaleDateString(),
        event.type,
        event.client,
        event.service,
        event.amount,
        event.status,
        diffDays,
        event.description
      ]);
    });

    // Crear workbook utilizando XLSX
    const wb = XLSX.utils.book_new();
    
    // Crear worksheet desde los datos
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Configurar ancho de columnas para mejor visualización
    const colWidths = [
      { wch: 12 },  // Fecha
      { wch: 20 },  // Tipo de Evento
      { wch: 25 },  // Cliente
      { wch: 30 },  // Servicio
      { wch: 12 },  // Monto
      { wch: 12 },  // Estado
      { wch: 10 },  // Días Restantes
      { wch: 50 }   // Descripción
    ];
    ws['!cols'] = colWidths;
    
    // Agregar worksheet al workbook
    XLSX.utils.book_append_sheet(wb, ws, "Calendario");
    
    // Generar nombre de archivo con fecha actual
    const fileName = `Calendario_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Descargar archivo
    XLSX.writeFile(wb, fileName);
    
    showToast(
      "success",
      "Exportación completa",
      `${calendarEvents.length} eventos de calendario exportados a ${fileName}`
    );
    console.log("Datos exportados para Excel:", excelData);
  } catch (error) {
    console.error("Error exportando calendario:", error);
    showToast("error", "Error", "No se pudo exportar el calendario");
  }
}

// Esta función ha sido movida al principio del archivo para estar disponible antes de su uso
// Ver la implementación en la sección de implementaciones tempranas

// Esta función ha sido movida al principio del archivo para estar disponible antes de su uso
// Ver la implementación en la sección de implementaciones tempranas

function createCalendarDay(date, isOtherMonth) {
  const dayElement = document.createElement("div");
  dayElement.className = `calendar-day ${isOtherMonth ? "other-month" : ""}`;
  const dayNumber = document.createElement("div");
  dayNumber.className = "day-number";
  dayNumber.textContent = date.getDate();
  const eventsContainer = document.createElement("div");
  eventsContainer.className = "day-events";
  if (date.toDateString() === currentDate.toDateString()) {
    dayElement.style.backgroundColor = "rgba(63,81,181,0.1)";
    dayElement.style.borderColor = "var(--primary-color)";
  }
  dayElement.appendChild(dayNumber);
  dayElement.appendChild(eventsContainer);
  if (!isOtherMonth) addEventsToCalendarDay(eventsContainer, date);
  dayElement.addEventListener("click", () => showDayDetails(date));
  return dayElement;
}

function addEventsToCalendarDay(container, date) {
  const dayEvents = calendarEvents.filter(
    (event) => event.date.toDateString() === date.toDateString()
  );
  if (dayEvents.length === 0) return;
  const eventsToShow = dayEvents.slice(0, 3);
  eventsToShow.forEach((event) => {
    const eventElement = document.createElement("div");
    let diffDays;
    if (event.type === "invoice") {
      if (event.status === "pagada") {
        eventElement.className = "day-event event-paid";
        eventElement.textContent = `${event.description} - Pagado`;
      } else if (event.status === "vencida") {
        eventElement.className = "day-event event-danger";
        eventElement.textContent = `${event.description} - Vencido`;
      } else {
        diffDays = Math.ceil(
          (event.date - currentDate) / (1000 * 60 * 60 * 24)
        );
        if (diffDays <= 0) {
          eventElement.className = "day-event event-danger";
          eventElement.textContent = `${event.description} - Vence hoy`;
        } else if (diffDays <= 5) {
          eventElement.className = "day-event event-warning";
          eventElement.textContent = `${event.description} - ${diffDays}d`;
        } else {
          eventElement.className = "day-event event-payment";
          eventElement.textContent = event.description;
        }
      }
    } else if (event.type === "partial-payment") {
      eventElement.className = "day-event event-paid";
      eventElement.textContent = `${event.description} - Pago parcial`;
    } else {
      // payment
      diffDays = Math.ceil((event.date - currentDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        eventElement.className = "day-event event-danger";
        eventElement.textContent = `${event.title} - Hoy`;
      } else if (diffDays <= 5) {
        eventElement.className = "day-event event-warning";
        eventElement.textContent = `${event.title} - ${diffDays}d`;
      } else {
        eventElement.className = "day-event event-payment";
        eventElement.textContent = event.title;
      }
    }
    eventElement.addEventListener("click", (e) => {
      e.stopPropagation();
      showEventDetails(event);
    });
    container.appendChild(eventElement);
  });
  if (dayEvents.length > 3) {
    const moreElement = document.createElement("div");
    moreElement.className = "day-event event-more";
    moreElement.textContent = `+${dayEvents.length - 3} más`;
    moreElement.addEventListener("click", (e) => {
      e.stopPropagation();
      showDayDetails(date);
    });
    container.appendChild(moreElement);
  }
}

// Implementación de showEventDetails (ya declarada al inicio del archivo)
showEventDetails = function(event) {
  console.log('🔍 DEBUG showEventDetails - Evento recibido:', event);
  let details = "";
  if (event.type === "invoice") {
    const diffDays = Math.ceil(
      (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    let statusText =
      event.status === "pagada"
        ? "Pagada"
        : diffDays < 0
        ? `Vencida hace ${Math.abs(diffDays)} días`
        : diffDays === 0
        ? "Vence hoy"
        : `Vence en ${diffDays} días`;
    const pendingAmount = event.amount - (event.paidAmount || 0);
    details = `
            <div class="event-detail-item"><div class="label">Tipo</div><div class="value">Vencimiento Proforma</div></div>
            <div class="event-detail-item"><div class="label">Proforma</div><div class="value">${
              event.invoiceNumber || "N/A"
            }</div></div>
            <div class="event-detail-item"><div class="label">Cliente</div><div class="value">${
              event.clientName || "N/A"
            }</div></div>
            <div class="event-detail-item"><div class="label">Servicio</div><div class="value">${
              event.serviceName || "N/A"
            }</div></div>
            <div class="event-detail-item"><div class="label">Monto Total</div><div class="value">S/. ${event.amount.toFixed(
              2
            )}</div></div>
            <div class="event-detail-item"><div class="label">Pagado</div><div class="value">S/. ${(
              event.paidAmount || 0
            ).toFixed(2)}</div></div>
            <div class="event-detail-item"><div class="label">Pendiente</div><div class="value">S/. ${pendingAmount.toFixed(
              2
            )}</div></div>
            <div class="event-detail-item"><div class="label">F. Vencimiento</div><div class="value">${new Date(
              event.date
            ).toLocaleDateString()}</div></div>
            <div class="event-detail-item"><div class="label">Estado</div><div class="value">${statusText}</div></div>
            <div class="event-detail-item"><div class="label">Acciones</div><div class="value">
                <button class="btn btn-primary btn-sm" onclick="openInvoiceModal(${
                  event.invoiceId
                })">Editar</button> 
                <button class="btn btn-success btn-sm" onclick="openPartialPaymentModal(${
                  event.invoiceId
                })">Reg. Pago</button>
            </div></div>`;
  } else if (event.type === "partial-payment") {
    details = `
            <div class="event-detail-item"><div class="label">Tipo</div><div class="value">Pago Parcial</div></div>
            <div class="event-detail-item"><div class="label">Cliente</div><div class="value">${
              event.clientName || "N/A"
            }</div></div>
            <div class="event-detail-item"><div class="label">Proforma</div><div class="value">${
              event.invoiceNumber || "N/A"
            }</div></div>
            <div class="event-detail-item"><div class="label">Monto Pagado</div><div class="value">S/. ${event.amount.toFixed(
              2
            )}</div></div>
            <div class="event-detail-item"><div class="label">Método</div><div class="value">${
              event.method ? capitalizeFirstLetter(event.method) : "N/A"
            }</div></div>
            <div class="event-detail-item"><div class="label">Fecha Pago</div><div class="value">${new Date(
              event.date
            ).toLocaleDateString()}</div></div>`;
  } else {
    // payment
    const diffDays = Math.ceil(
      (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    let statusText =
      diffDays < 0
        ? `Vencido hace ${Math.abs(diffDays)} días`
        : diffDays === 0
        ? "Vence hoy"
        : `Vence en ${diffDays} días`;
    details = `
            <div class="event-detail-item"><div class="label">Tipo</div><div class="value">Pago Programado</div></div>
            <div class="event-detail-item"><div class="label">Cliente</div><div class="value">${
              event.clientName || "N/A"
            }</div></div>
            <div class="event-detail-item"><div class="label">Servicio</div><div class="value">${
              event.serviceName || "N/A"
            }</div></div>
            <div class="event-detail-item"><div class="label">Monto</div><div class="value">S/. ${event.amount.toFixed(
              2
            )}</div></div>
            <div class="event-detail-item"><div class="label">Fecha Pago</div><div class="value">${new Date(
              event.date
            ).toLocaleDateString()}</div></div>
            <div class="event-detail-item"><div class="label">Estado</div><div class="value">${statusText}</div></div>
            <div class="event-detail-item"><div class="label">Acciones</div><div class="value">
                <button class="btn btn-primary btn-sm" onclick="openContractedServiceModal(${
                  event.contractedServiceId
                })">Editar</button> 
                <button class="btn btn-success btn-sm" onclick="createInvoiceFromService(${
                  event.contractedServiceId
                })">Generar Proforma</button>
            </div></div>`;
  }
  const eventTitleEl = document.getElementById("event-title");
  const eventDetailsEl = document.getElementById("event-details");
  if (eventTitleEl) eventTitleEl.textContent = event.title;
  if (eventDetailsEl) eventDetailsEl.innerHTML = details;
  showModal("event-modal");
}

// Implementación de showDayDetails (ya declarada al inicio del archivo)
showDayDetails = function(date) {
  const dayEvents = calendarEvents.filter(
    (event) => event.date.toDateString() === date.toDateString()
  );
  if (dayEvents.length === 0) {
    showToast("No hay eventos para este día", "info");
    return;
  }
  let details = `<h3>Eventos del ${date.toLocaleDateString()}</h3>`;
  const groupedEvents = {};
  dayEvents.forEach((event) => {
    if (!groupedEvents[event.type]) groupedEvents[event.type] = [];
    groupedEvents[event.type].push(event);
  });
  for (const type in groupedEvents) {
    let typeTitle =
      type === "invoice"
        ? "Vencimientos de Proformas"
        : type === "payment"
        ? "Pagos Programados"
        : "Pagos Parciales Registrados";
    details += `<h4>${typeTitle} (${groupedEvents[type].length})</h4><div class="events-list">`;
    groupedEvents[type].forEach((event, index) => {
      const eventId = `event_${type}_${index}`;
      // Guardar el evento en una variable global temporal para el onclick
      if (!window.tempEvents) window.tempEvents = {};
      window.tempEvents[eventId] = event;
      
      console.log('🔍 DEBUG: Generando evento para modal:', event);
      
      details += `<div class="event-item" onclick='showEventDetails(window.tempEvents["${eventId}"])'><div><strong>${
        event.title || 'Sin título'
      }</strong></div><div>${event.description || 'Sin descripción'}</div>${
        event.amount ? `<div>Monto: S/. ${event.amount.toFixed(2)}</div>` : ""
      }</div>`;
    });
    details += `</div>`;
  }
  details += `<style>.events-list{margin-bottom:20px;}.event-item{padding:10px;border:1px solid var(--border-color);border-radius:var(--border-radius);margin-bottom:10px;cursor:pointer;transition:background-color var(--transition-speed);}.event-item:hover{background-color:rgba(0,0,0,0.02);}</style>`;
  const eventTitleEl = document.getElementById("event-title");
  const eventDetailsEl = document.getElementById("event-details");
  if (eventTitleEl)
    eventTitleEl.textContent = `Eventos del ${date.toLocaleDateString()}`;
  if (eventDetailsEl) eventDetailsEl.innerHTML = details;
  showModal("event-modal");
}

async function createInvoiceFromService(csId) {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/contracted-services/${csId}`
    );
    const cs = response.data || response;
    if (!cs) {
      showToast("error", "Error", "Servicio contratado no encontrado");
      return;
    }
    closeModal("event-modal");
    openInvoiceModal(null, cs); // Pass contractedService object
  } catch (error) {
    console.error("Error cargando servicio contratado:", error);
    showToast("error", "Error", "No se pudo cargar el servicio contratado");
  }
}

// Implementación de changeCalendarMonth (ya declarada al inicio del archivo)
changeCalendarMonth = async function(change) {
  currentCalendarMonth += change;
  if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  } else if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  }
  await loadCalendarData();
}

// Funciones de Notificaciones
function toggleNotifications() {
  const dropdown = document.getElementById("notifications-dropdown");
  if (!dropdown) return;
  dropdown.classList.toggle("hidden");
  if (!dropdown.classList.contains("hidden")) loadNotifications();
}

// Implementación de loadNotifications (actualiza la referencia declarada anteriormente)
loadNotifications = async function() {
  const container = document.getElementById("notifications-list");
  if (!container) return;

  try {
    // Mostrar indicador de carga
    container.innerHTML =
      '<div class="notification-item"><div class="notification-message">Cargando notificaciones...</div></div>';

    // Cargar notificaciones desde la API
    const response = await fetchWithAuth(`${API_BASE_URL}/notifications`);
    const notifications = response.data || response || [];
    const unreadCount =
      response.unreadCount || notifications.filter((n) => !n.read).length;

    // Actualizar badge de notificaciones
    const badge = document.querySelector(
      "#notification-bell .notification-badge"
    );
    if (badge) badge.textContent = unreadCount > 0 ? unreadCount : "0";

    // Limpiar contenedor
    container.innerHTML = "";

    if (notifications.length === 0) {
      container.innerHTML =
        '<div class="notification-item"><div class="notification-message">No hay notificaciones.</div></div>';
      return;
    }

    notifications.forEach((notification) => {
      const item = document.createElement("div");
      item.className = `notification-item ${notification.read ? "" : "unread"}`;
      item.setAttribute("data-id", notification.id);

      let iconClass = "fa-info-circle";
      if (notification.type === "warning") iconClass = "fa-exclamation-circle";
      else if (notification.type === "danger")
        iconClass = "fa-exclamation-triangle";
      else if (notification.type === "success") iconClass = "fa-check-circle";

      item.innerHTML = `
                <div class="notification-content">
                    <div class="notification-icon"><i class="fas ${iconClass}"></i></div>
                    <div class="notification-text">
                        <div class="notification-title">${
                          notification.title
                        }</div>
                        <div class="notification-message">${
                          notification.message
                        }</div>
                        <div class="notification-time">${
                          notification.time ||
                          new Date(notification.createdAt).toLocaleString()
                        }</div>
                    </div>
                </div>`;

      item.addEventListener("click", () => {
        handleNotificationClick(notification);
      });

      container.appendChild(item);
    });
  } catch (error) {
    console.error("Error cargando notificaciones:", error);
    container.innerHTML =
      '<div class="notification-item"><div class="notification-message">Error al cargar notificaciones.</div></div>';
  }
};

async function handleNotificationClick(notification) {
  try {
    // Marcar como leída
    await markNotificationAsRead(notification.id);

    // Cerrar dropdown de notificaciones
    const dropdown = document.getElementById("notifications-dropdown");
    if (dropdown) dropdown.classList.add("hidden");

    // Navegar a la sección relacionada si existe
    if (notification.relatedSection && notification.relatedId) {
      loadView(notification.relatedSection); // Cambiar vista primero

      // Después del cambio de vista, intentar mostrar el item relacionado
      setTimeout(() => {
        const entityType =
          notification.entityType || notification.relatedSection;
        switch (entityType.toLowerCase()) {
          case "client":
          case "clients":
            if (typeof viewClient === "function") {
              viewClient(notification.relatedId);
            }
            break;
          case "contracted-service":
          case "contracted-services":
          case "contractedservice":
            if (typeof viewContractedService === "function") {
              viewContractedService(notification.relatedId);
            }
            break;
          case "invoice":
          case "invoices":
            if (typeof viewInvoice === "function") {
              viewInvoice(notification.relatedId);
            }
            break;
          case "service":
          case "services":
            if (typeof viewService === "function") {
              viewService(notification.relatedId);
            }
            break;
          case "payment":
          case "payments":
            // Para pagos, mostrar la factura relacionada
            if (notification.invoiceId && typeof viewInvoice === "function") {
              viewInvoice(notification.invoiceId);
            }
            break;
          default:
            console.log(`Tipo de entidad no manejado: ${entityType}`);
        }
      }, 100);
    }
  } catch (error) {
    console.error("Error manejando click de notificación:", error);
  }
}

async function markNotificationAsRead(id) {
  try {
    await fetchWithAuth(`${API_BASE_URL}/notifications/${id}/read`, "PUT");
    // Recargar notificaciones para actualizar el estado
    await loadNotifications();
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    showToast("error", "Error", "No se pudo marcar la notificación como leída");
  }
}

// This function has been moved to the top level to fix a reference error
// See the declaration at the beginning of the file

// Funciones de Configuración
async function setupCompanySettingsForm() {
  const form = document.getElementById("company-form");
  if (!form) return;

  try {
    // Cargar configuración de empresa desde la API
    const settings = await fetchWithAuth(`${API_BASE_URL}/settings/company`);

    if (settings) {
      document.getElementById("company-name").value = settings.name || "";
      document.getElementById("company-ruc").value = settings.ruc || "";
      document.getElementById("company-address").value = settings.address || "";
      document.getElementById("company-phone").value = settings.phone || "";
      document.getElementById("company-email").value = settings.email || "";

      // Manejar logo si existe
      const logoPreview = document.getElementById("company-logo-preview");
      if (logoPreview && settings.logoUrl) {
        logoPreview.innerHTML = `<img src="${settings.logoUrl}" alt="Logo actual" style="max-width: 200px; max-height: 100px;"/>`;
      }
    }
  } catch (error) {
    console.error("Error cargando configuración de empresa:", error);
    showToast(
      "error",
      "Error",
      "No se pudo cargar la configuración de empresa"
    );
  }

  // Configurar el submit del formulario
  form.onsubmit = async function (event) {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Guardando...";

    try {
      const companyData = {
        name: document.getElementById("company-name").value,
        ruc: document.getElementById("company-ruc").value,
        address: document.getElementById("company-address").value,
        phone: document.getElementById("company-phone").value,
        email: document.getElementById("company-email").value,
      };

      // Verificar si hay un archivo de logo
      const logoInput = document.getElementById("company-logo");
      if (logoInput && logoInput.files.length > 0) {
        // Si hay logo, enviar como FormData
        const formData = new FormData();
        Object.keys(companyData).forEach((key) => {
          formData.append(key, companyData[key]);
        });
        formData.append("logo", logoInput.files[0]);

        const result = await fetch(`${API_BASE_URL}/settings/company`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: formData,
        });

        if (!result.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
      } else {
        // Sin logo, enviar JSON normal
        await fetchWithAuth(
          `${API_BASE_URL}/settings/company`,
          "PUT",
          companyData
        );
      }

      showToast(
        "success",
        "Configuración",
        "Configuración de empresa guardada exitosamente"
      );
    } catch (error) {
      console.error("Error guardando configuración de empresa:", error);
      showToast(
        "error",
        "Error",
        "No se pudo guardar la configuración de empresa"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  };

  // Configurar vista previa del logo
  const logoInput = document.getElementById("company-logo");
  if (logoInput) {
    logoInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      const preview = document.getElementById("company-logo-preview");

      if (file && preview) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.innerHTML = `<img src="${e.target.result}" alt="Vista previa del logo" style="max-width: 200px; max-height: 100px;"/>`;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

async function setupAlertsSettingsForm() {
  const form = document.getElementById("alerts-form");
  if (!form) return;

  try {
    // Cargar configuración de alertas desde la API
    const settings = await fetchWithAuth(`${API_BASE_URL}/settings/alerts`);

    if (settings) {
      document.getElementById("alert-days-1").value = settings.firstAlert || 7;
      document.getElementById("alert-days-2").value = settings.secondAlert || 3;
      document.getElementById("email-alerts").checked =
        settings.emailAlerts !== false;
      document.getElementById("system-alerts").checked =
        settings.systemAlerts !== false;
    }
  } catch (error) {
    console.error("Error cargando configuración de alertas:", error);
    showToast(
      "error",
      "Error",
      "No se pudo cargar la configuración de alertas"
    );

    // Valores por defecto en caso de error
    document.getElementById("alert-days-1").value = 7;
    document.getElementById("alert-days-2").value = 3;
    document.getElementById("email-alerts").checked = true;
    document.getElementById("system-alerts").checked = true;
  }

  // Configurar el submit del formulario
  form.onsubmit = async function (event) {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Guardando...";

    try {
      const alertsData = {
        firstAlert: parseInt(document.getElementById("alert-days-1").value),
        secondAlert: parseInt(document.getElementById("alert-days-2").value),
        emailAlerts: document.getElementById("email-alerts").checked,
        systemAlerts: document.getElementById("system-alerts").checked,
      };

      await fetchWithAuth(`${API_BASE_URL}/settings/alerts`, "PUT", alertsData);

      showToast(
        "success",
        "Configuración",
        "Configuración de alertas guardada exitosamente"
      );
    } catch (error) {
      console.error("Error guardando configuración de alertas:", error);
      showToast(
        "error",
        "Error",
        "No se pudo guardar la configuración de alertas"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  };
}

function setupPasswordForm() {
  const form = document.getElementById("password-form");
  if (!form) return;
  form.onsubmit = function (event) {
    event.preventDefault();
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    if (currentPassword !== "admin") {
      showToast("Contraseña actual incorrecta", "error");
      return;
    } // Simulación
    if (newPassword !== confirmPassword) {
      showToast("Nuevas contraseñas no coinciden", "error");
      return;
    }
    showToast("Contraseña cambiada exitosamente (simulado)", "success");
    form.reset();
  };
}

// Otras funciones
// NOTA: La función checkForDueAlerts() se ha movido al backend.
// El backend ahora maneja la verificación automática de vencimientos
// y genera las notificaciones correspondientes de forma programada.
// Las notificaciones se obtienen a través del endpoint /notifications.

// Implementación de handleGlobalSearch (ya declarada al inicio del archivo)
handleGlobalSearch = async function(event) {
  const searchTerm = event.target.value.toLowerCase().trim();

  // Para la sección de clientes, usar el filtro específico existente
  if (
    currentSection === "clients" &&
    document.getElementById("client-search")
  ) {
    document.getElementById("client-search").value = searchTerm;
    applyClientFilters();
    return;
  }

  try {
    if (searchTerm === "") {
      // Recargar datos sin filtro
      if (currentSection === "contracted-services") {
        await loadContractedServicesData();
      } else if (currentSection === "invoices") {
        await loadInvoicesData();
      }
      return;
    }

    // Búsqueda por sección usando parámetros de API
    if (currentSection === "contracted-services") {
      const searchResults = await fetchWithAuth(
        `${API_BASE_URL}/contracted-services?search=${encodeURIComponent(
          searchTerm
        )}&include=client,service`
      );
      if (searchResults) {
        filteredContractedServices = searchResults;
        currentContractedServicePage = 1;
        renderContractedServicesTable();
        updateContractedServicePagination();
      }
    } else if (currentSection === "invoices") {
      const searchResults = await fetchWithAuth(
        `${API_BASE_URL}/invoices?search=${encodeURIComponent(
          searchTerm
        )}&include=client,service,payments`
      );
      if (searchResults) {
        filteredInvoices = searchResults;
        currentInvoicePage = 1;
        renderInvoicesTable();
        updateInvoicePagination();
      }
    }
  } catch (error) {
    console.error("Error en búsqueda global:", error);
    showToast("error", "Error", "Error al realizar la búsqueda");
  }
}

// --- FIN DE FUNCIONES COPIADAS/ADAPTADAS ---

// --- ESTRUCTURA MODULAR CENTRAL (del app.modular.js anterior) ---

// Función para inicializar la aplicación (ya definida al inicio, la mantengo por si hay diferencias menores)
// function initApp() { // ... } // Comentada para evitar redefinición

// Función para manejar el inicio de sesión (ya definida)
// async function handleLogin(event) { // ... } // Comentada

// Función para cargar todos los componentes del dashboard (ya definida)
// async function loadDashboardComponents() { // ... } // Comentada

// Configura los event listeners para los componentes cargados dinámicamente (ya definida)
// function setupComponentEventListeners() { // ... } // Comentada, PERO la llamaremos DESPUÉS de cargar header.
// Ahora se llama dentro de loadDashboardComponents

// Función para cargar una vista específica (ya definida)
// async function loadView(sectionName) { // ... } // Comentada

// Configura los event listeners específicos para cada vista (ya definida)
// function setupViewEventListeners(sectionName) { // ... } // Comentada, se llama desde loadView

// Configura los event listeners para los modales una vez cargados
// (definición ya incluida arriba, nos aseguraremos que se llame)
// function setupModalEventListeners() { // ... }

// Carga los datos específicos para cada sección (ya definida)
// function loadSectionData(sectionName) { // ... } // Comentada, se llama desde loadView

// Función para manejar el cierre de sesión (ya definida)
// function handleLogout() { // ... } // Comentada

// Modificación: Asegurar que setupModalEventListeners se llame después de cargar los modales.
// Se ha añadido la llamada a setupModalEventListeners() al final de la función loadDashboardComponents() original.
// También se ha añadido la llamada a setupComponentEventListeners() allí.

// Ajuste en loadDashboardComponents para llamar a setupModalEventListeners:
async function loadDashboardComponents() {
  try {
    console.log("Cargando componentes del dashboard...");
    await loadComponents([
      { url: "components/layout/sidebar.html", targetId: "sidebar-container" },
      { url: "components/layout/header.html", targetId: "header-container" },
    ]);
    await loadComponent(
      "components/shared/notification-dropdown.html",
      "notifications-dropdown"
    );
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
    await loadComponent("components/shared/toast.html", "toast"); // El ID del div que contiene el toast en index.html
    // Configurar listeners DESPUÉS de que los componentes estén en el DOM
    setupComponentEventListeners(); // Para sidebar, header (que ya deberían estar cargados)
    setupModalEventListeners(); // Para todos los modales (que ya deberían estar cargados)
    setupInvoiceActionListeners(); // Para los botones de acción de facturas

    // Adjuntar listener para búsqueda global si el header ya está cargado
    const globalSearchInput = document.getElementById("global-search");
    if (globalSearchInput) {
      globalSearchInput.addEventListener("input", handleGlobalSearch);
    } else {
      console.warn(
        "Input de búsqueda global no encontrado tras cargar header."
      );
    }

    return true;
  } catch (error) {
    console.error("Error al cargar componentes del dashboard:", error);
    return false;
  }
}

// Inicialización cuando se carga la página (ya definida al inicio y es correcta)
document.addEventListener("DOMContentLoaded", function () {
  initApp();
});