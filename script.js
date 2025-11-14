/* script.js - lógica para GarageOnline

   - carga de vehículos desde JSON

   - renderizado de tarjetas

   - evento delegado para ver detalle

   - gestión de carrito con modal de cantidad

   - persistencia en localStorage

   - simulación de pago y generación de PDF con jsPDF

*/



document.addEventListener('DOMContentLoaded', () => {

  // URL del JSON solicitado
  // Mantenemos tu URL original, aunque podría ser la fuente de un problema de carga.
  const DATA_URL = 'https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json';


  // Elementos del DOM
  const productsContainer = document.getElementById('productsContainer');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const loadError = document.getElementById('loadError');
  const searchInput = document.getElementById('searchInput');
  const cartCount = document.getElementById('cartCount');
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalSpan = document.getElementById('cartTotal');
  const quantityModalEl = document.getElementById('quantityModal');
  const quantityInput = document.getElementById('quantityInput');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const detailModalEl = document.getElementById('detailModal');
  const detailImage = document.getElementById('detailImage');
  const detailList = document.getElementById('detailList');
  const detailAddToCart = document.getElementById('detailAddToCart');
  const processPaymentBtn = document.getElementById('processPaymentBtn');
  const paymentForm = document.getElementById('paymentForm');
  const yearSpan = document.getElementById('year');

  // Bootstrap modal instances (se crearan al usarse)
  const bsQuantityModal = new bootstrap.Modal(quantityModalEl, { keyboard: true, backdrop: 'static' });
  const bsDetailModal = new bootstrap.Modal(detailModalEl, { keyboard: true, backdrop: true });
  // cartModal y paymentModal están controlados vía atributos data-bs-*

  // Variables de estado
  let vehiclesData = []; // datos cargados del JSON
  let cart = []; // array de items en carrito
  let selectedVehicleForQuantity = null; // vehiculo actual para modal de cantidad
  let selectedVehicleForDetail = null;

  yearSpan.textContent = new Date().getFullYear();

  // Cargar carrito desde localStorage (persistencia)
  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem('garage_cart_v1');
      if (raw) cart = JSON.parse(raw) || [];
    } catch (e) {
      console.warn('No se pudo cargar carrito de localStorage', e);
      cart = [];
    }
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem('garage_cart_v1', JSON.stringify(cart));
    } catch (e) {
      console.warn('No se pudo guardar carrito', e);
    }
  }

  // ---------- Fetch de datos ----------
  async function loadVehicles() {
    try {
      showSpinner(true);
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Guardar en vehiclesData
      vehiclesData = Array.isArray(data) ? data : (data.vehiculos || []);
      displayVehicles(vehiclesData);
    } catch (err) {
      console.error('Error cargando vehículos:', err);
      loadError.textContent = 'Error cargando los vehículos. Intenta recargar la página o revisa la conexión.';
      loadError.classList.remove('d-none');
      productsContainer.innerHTML = '';
    } finally {
      showSpinner(false);
    }
  }

  function showSpinner(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
    loadingSpinner.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  // ---------- Renderizado de tarjetas ----------
  function displayVehicles(list) {
    productsContainer.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
      productsContainer.innerHTML = `<div class="col-12"><p class="text-muted">No hay vehículos que mostrar.</p></div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    list.forEach(vehicle => {
      // limpiar emojis del campo tipo
      const tipoClean = String(vehicle.tipo || '').replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

      const col = document.createElement('div');
      col.className = 'col-md-4 col-sm-6 mb-4';

      const card = document.createElement('div');
      card.className = 'card h-100';
      card.setAttribute('role', 'article');

      // Imagen con boton para ver detalle
      const imgWrapper = document.createElement('button');
      imgWrapper.className = 'btn p-0 border-0 viewDetailsBtn';
      imgWrapper.setAttribute('type','button');
      imgWrapper.setAttribute('aria-label', `Ver detalles de ${vehicle.marca} ${vehicle.modelo}`);
      // Guardamos un data-codigo para identificar
      imgWrapper.dataset.codigo = String(vehicle.codigo);

      const img = document.createElement('img');
      img.className = 'card-img-top';
      img.src = vehicle.imagen || '';
      img.loading = 'lazy';
      img.alt = `${vehicle.marca} ${vehicle.modelo}`;
      imgWrapper.appendChild(img);

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body d-flex flex-column';

      const title = document.createElement('h5');
      title.className = 'card-title';
      title.textContent = `${vehicle.marca} ${vehicle.modelo}`;

      const desc = document.createElement('p');
      desc.className = 'card-text desc text-muted';
      desc.textContent = vehicle.categoria ? `${vehicle.categoria} • ${tipoClean}` : tipoClean;

      const price = document.createElement('p');
      price.className = 'fw-bold mt-auto';
      const precio = typeof vehicle.precio_venta === 'number' ? vehicle.precio_venta : Number(String(vehicle.precio_venta || '0').replace(/[^0-9.-]+/g,''));
      price.textContent = precio.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });

      const actions = document.createElement('div');
      actions.className = 'd-flex gap-2 mt-3';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary addToCartBtn';
      addBtn.type = 'button';
      addBtn.textContent = 'Añadir al Carrito';
      addBtn.dataset.codigo = String(vehicle.codigo);
      addBtn.setAttribute('aria-label', `Añadir ${vehicle.marca} ${vehicle.modelo} al carrito`);

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-outline-secondary viewDetailsBtn';
      viewBtn.type = 'button';
      viewBtn.textContent = 'Ver detalle';
      viewBtn.dataset.codigo = String(vehicle.codigo);

      actions.appendChild(addBtn);
      actions.appendChild(viewBtn);

      cardBody.appendChild(title);
      cardBody.appendChild(desc);
      cardBody.appendChild(price);
      cardBody.appendChild(actions);

      card.appendChild(imgWrapper);
      card.appendChild(cardBody);
      col.appendChild(card);

      fragment.appendChild(col);
    });

    productsContainer.appendChild(fragment);

    // Después de crear todas las tarjetas, inicializamos listeners específicos
    addAddToCartListeners();
  }

  // ---------- Filtrado ----------
  function filterVehicles() {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) {
      displayVehicles(vehiclesData);
      return;
    }
    const filtered = vehiclesData.filter(v => {
      const marca = String(v.marca || '').toLowerCase();
      const modelo = String(v.modelo || '').toLowerCase();
      const cat = String(v.categoria || '').toLowerCase();
      return marca.includes(q) || modelo.includes(q) || cat.includes(q);
    });
    displayVehicles(filtered);
  }

  // ---------- Carrito: funciones ----------
  function findCartIndexByCodigo(codigo) {
    return cart.findIndex(i => String(i.codigo) === String(codigo));
  }

  function addItemToCart(vehicle, quantity) {
    const idx = findCartIndexByCodigo(vehicle.codigo);
    if (idx >= 0) {
      cart[idx].quantity = Number(cart[idx].quantity) + Number(quantity);
    } else {
      cart.push({
        codigo: vehicle.codigo,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        precio: Number(vehicle.precio_venta || 0),
        imagen: vehicle.imagen || '',
        quantity: Number(quantity)
      });
    }
    saveCartToStorage();
    updateCartUI();
    // animar badge
    cartCount.classList.add('pulse');
    setTimeout(()=>cartCount.classList.remove('pulse'), 600);
  }

  function updateCartUI() {
    // limpiar
    cartItemsContainer.innerHTML = '';
    const checkoutBtn = document.getElementById('checkoutBtn'); // Asegurarse de obtener el botón
    let total = 0;
    
    if (!cart.length) {
      cartItemsContainer.innerHTML = '<p class="text-muted">Tu carrito está vacío.</p>';
      cartCount.textContent = '0';
      cartTotalSpan.textContent = formatPrice(0);
      if(checkoutBtn) checkoutBtn.disabled = true;
      return;
    }
    if(checkoutBtn) checkoutBtn.disabled = false;


    cart.forEach(item => {
      const subtotal = Number(item.precio || 0) * Number(item.quantity || 0);
      total += subtotal;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'd-flex align-items-center mb-3';
      itemDiv.setAttribute('role','listitem');

      const img = document.createElement('img');
      img.src = item.imagen;
      img.alt = `${item.marca} ${item.modelo}`;
      img.style.width = '80px';
      img.style.height = '50px';
      img.style.objectFit = 'cover';
      img.className = 'me-3 rounded';

      const info = document.createElement('div');
      info.className = 'flex-grow-1';
      info.innerHTML = `<strong>${item.marca} ${item.modelo}</strong><br><small class="text-muted">Cantidad: ${item.quantity} • Subtotal: ${formatPrice(subtotal)}</small>`;

      const actions = document.createElement('div');
      actions.className = 'd-flex gap-2 ms-3';
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-sm btn-outline-danger';
      removeBtn.textContent = 'Eliminar';
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', () => {
        removeFromCart(item.codigo);
      });

      const incBtn = document.createElement('button');
      incBtn.className = 'btn btn-sm btn-outline-secondary';
      incBtn.textContent = '+';
      incBtn.type = 'button';
      incBtn.addEventListener('click', () => changeQuantity(item.codigo, item.quantity + 1));

      const decBtn = document.createElement('button');
      decBtn.className = 'btn btn-sm btn-outline-secondary';
      decBtn.textContent = '-';
      decBtn.type = 'button';
      decBtn.addEventListener('click', () => changeQuantity(item.codigo, Math.max(1, item.quantity - 1)));

      actions.appendChild(decBtn);
      actions.appendChild(incBtn);
      actions.appendChild(removeBtn);

      itemDiv.appendChild(img);
      itemDiv.appendChild(info);
      itemDiv.appendChild(actions);

      cartItemsContainer.appendChild(itemDiv);
    });

    cartCount.textContent = cart.reduce((s,i)=>s+Number(i.quantity),0);
    cartTotalSpan.textContent = formatPrice(total);
  }

  function removeFromCart(codigo) {
    cart = cart.filter(i => String(i.codigo) !== String(codigo));
    saveCartToStorage();
    updateCartUI();
  }

  function changeQuantity(codigo, newQty) {
    const idx = findCartIndexByCodigo(codigo);
    if (idx >= 0) {
      cart[idx].quantity = Number(newQty);
      saveCartToStorage();
      updateCartUI();
    }
  }

  function formatPrice(v) {
    const n = Number(v || 0);
    return n.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });
  }

  // ---------- Listeners para botones "Añadir al Carrito" (después de renderizar tarjetas) ----------
  function addAddToCartListeners() {
    const addBtns = document.querySelectorAll('.addToCartBtn');
    addBtns.forEach(btn => {
      btn.removeEventListener('click', onAddBtnClick); // evitar duplicados
      btn.addEventListener('click', onAddBtnClick);
    });
  }

  function onAddBtnClick(e) {
    const codigo = e.currentTarget.dataset.codigo;
    const vehicle = vehiclesData.find(v => String(v.codigo) === String(codigo));
    if (!vehicle) return;
    selectedVehicleForQuantity = vehicle;
    quantityInput.value = 1;
    bsQuantityModal.show();
  }

  // Cuando se confirma en modal cantidad
  addToCartBtn.addEventListener('click', () => {
    const q = Number(quantityInput.value || 0);
    if (!selectedVehicleForQuantity) return;
    if (!Number.isFinite(q) || q <= 0) {
      alert('Ingrese una cantidad válida (mayor que 0).');
      return;
    }
    addItemToCart(selectedVehicleForQuantity, q);
    selectedVehicleForQuantity = null;
    bsQuantityModal.hide();
  });

  // ---------- Event delegation para ver detalle (un solo oyente) ----------
  productsContainer.addEventListener('click', (e) => {
    const target = e.target;
    // buscamos el botón exacto con clase .viewDetailsBtn (o si el elemento clicked está dentro de uno)
    const btn = target.closest('.viewDetailsBtn');
    if (!btn || !productsContainer.contains(btn)) return;
    const codigo = btn.dataset.codigo;
    if (!codigo) return;
    const vehicle = vehiclesData.find(v => String(v.codigo) === String(codigo));
    if (!vehicle) return;
    openDetailModal(vehicle);
  });

  // Abrir modal detalle
  function openDetailModal(vehicle) {
    selectedVehicleForDetail = vehicle;
    detailImage.src = vehicle.imagen || '';
    detailImage.alt = `${vehicle.marca} ${vehicle.modelo}`;
    detailList.innerHTML = '';
    const listFragment = document.createDocumentFragment();

    const fields = [
      ['Marca', vehicle.marca],
      ['Modelo', vehicle.modelo],
      ['Categoría', vehicle.categoria],
      ['Tipo', String(vehicle.tipo || '').replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()],
      ['Precio', formatPrice(Number(vehicle.precio_venta || 0))],
      ['Código', vehicle.codigo]
    ];

    fields.forEach(([k,v]) => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `<strong>${k}:</strong> ${v ?? ''}`;
      listFragment.appendChild(li);
    });
    detailList.appendChild(listFragment);

    // configurar botón Añadir en detalle para abrir modal de cantidad
    detailAddToCart.onclick = () => {
      selectedVehicleForQuantity = vehicle;
      quantityInput.value = 1;
      bsDetailModal.hide();
      bsQuantityModal.show();
    };

    bsDetailModal.show();
  }

  // ---------- Pago: simulación y generación PDF (jsPDF) ----------

  processPaymentBtn.addEventListener('click', async () => {
    // Validación mínima de formulario
    const name = document.getElementById('payName').value.trim();
    const card = document.getElementById('payCard').value.trim();
    const exp = document.getElementById('payExp').value.trim();
    const cvv = document.getElementById('payCvv').value.trim();

    if (!name || !card || !exp || !cvv) {
      alert('Por favor, completa todos los campos del formulario de pago.');
      return;
    }

    if (!cart.length) {
      alert('El carrito está vacío.');
      return;
    }
    
    // 1. CREAR COPIA DEL CARRITO ANTES DE CUALQUIER OTRA COSA
    const itemsToInvoice = JSON.parse(JSON.stringify(cart));


    try {
      // Simular éxito de pago
      alert('Pago procesado con éxito. Se generará la factura en PDF.');

      // 2. Generar factura PDF usando la copia
      generateInvoicePDF(name, itemsToInvoice); // Ahora pasamos el argumento

      // 3. Vaciar carrito (AHORA SÍ, DESPUÉS DE LA GENERACIÓN)
      cart = [];
      saveCartToStorage();
      updateCartUI();

      // Cerrar modales (si están abiertos)
      const paymentModalInstance = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
      if (paymentModalInstance) paymentModalInstance.hide();
      const cartModalInstance = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
      if (cartModalInstance) cartModalInstance.hide();

    } catch (err) {
      console.error('Error en pago:', err);
      alert('Ocurrió un error procesando el pago.');
    }
  });


  // FUNCIÓN MODIFICADA PARA ACEPTAR EL CARRITO COMO PARÁMETRO
  function generateInvoicePDF(clientName, itemsToInvoice) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
        
      doc.setFontSize(14);
      doc.text('GarageOnline', 14, 20);
      doc.setFontSize(11);
      doc.text(`Factura para: ${clientName}`, 14, 30);
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 36);

      let y = 50;
      doc.setFontSize(10);
      doc.text('Items:', 14, y);
      y += 6;

      let total = 0;
      // Usamos el array itemsToInvoice que fue pasado como argumento
      itemsToInvoice.forEach((it, idx) => {
        const subtotal = Number(it.precio || 0) * Number(it.quantity || 0);
        total += subtotal;
        const line = `${idx + 1}. ${it.marca} ${it.modelo} — Cantidad: ${it.quantity} — Subtotal: ${formatPrice(subtotal)}`;
        doc.text(line, 14, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 20; }
      });

      y += 8;
      doc.setFontSize(12);
      doc.text(`Total: ${formatPrice(total)}`, 14, y);

      // Guardar
      const filename = `Factura-GarageOnline-${Date.now()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Error generando PDF', err);
      alert('No se pudo generar la factura en PDF.');
    }
  }


  // ---------- Eventos varios ----------
  searchInput.addEventListener('input', (e) => filterVehicles());

  // Inicializaciones
  loadCartFromStorage();
  updateCartUI();
  loadVehicles();

  // Exponer funciones útiles para debugging (opcional)
  window._garage = {
    loadVehicles, vehiclesData, cart, addItemToCart, updateCartUI
  };
});
