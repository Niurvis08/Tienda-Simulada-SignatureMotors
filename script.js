/* script.js - lógica para GarageOnline
   - vehículos embebidos (20 de alta gama)
   - renderizado de tarjetas
   - evento delegado para ver detalle
   - gestión de carrito con modal de cantidad
   - persistencia en localStorage
   - simulación de pago y generación de PDF con jsPDF
*/

document.addEventListener('DOMContentLoaded', () => {

  // ---------- CONFIG ----------
  // Nota: ya no dependemos de un JSON remoto; los vehículos están embebidos.
  const SIMULATED_LOAD_MS = 600; // tiempo de "carga" para mostrar el spinner

  // Elementos del DOM
  const productsContainer = document.getElementById('productsContainer');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const loadError = document.getElementById('loadError');
  const searchInput = document.getElementById('searchInput');
  const cartCount = document.getElementById('cartCount');
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotalElement'); // coincide con tu HTML
  const quantityModalEl = document.getElementById('quantityModal');
  const quantityInput = document.getElementById('quantityInput');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const detailModalEl = document.getElementById('detailModal');
  const detailImage = document.getElementById('detailImage');
  const detailList = document.getElementById('detailList');
  const detailAddToCart = document.getElementById('detailAddToCart');
  const processPaymentBtn = document.getElementById('processPaymentBtn');
  const yearSpan = document.getElementById('year');

  // Modales Bootstrap
  const bsQuantityModal = new bootstrap.Modal(quantityModalEl, { keyboard: true, backdrop: 'static' });
  const bsDetailModal = new bootstrap.Modal(detailModalEl, { keyboard: true, backdrop: true });

  // Estado
  let vehiclesData = []; // se llenará desde VEHICLES_STATIC
  let cart = [];
  let selectedVehicleForQuantity = null;
  let selectedVehicleForDetail = null;

  yearSpan.textContent = new Date().getFullYear();

  // -------------------- VEHÍCULOS EMBEBIDOS (20 alta gama) --------------------
  const VEHICLES_STATIC = [
    { codigo: 'VM001', marca: 'Lamborghini', modelo: 'Huracán EVO', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 280000, imagen: 'https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM002', marca: 'Ferrari', modelo: '812 Superfast', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 335000, imagen: 'https://images.unsplash.com/photo-1549924231-2b8f6a0a1a9b?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM003', marca: 'Porsche', modelo: '911 Turbo S', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 220000, imagen: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM004', marca: 'Bentley', modelo: 'Continental GT', categoria: 'Lujo', tipo: 'Coupe', precio_venta: 240000, imagen: 'https://images.unsplash.com/photo-1511391403668-6a1f4a6b5b9d?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM005', marca: 'Rolls-Royce', modelo: 'Phantom', categoria: 'Lujo', tipo: 'Sedán', precio_venta: 455000, imagen: 'https://images.unsplash.com/photo-1541446654331-3b2f44b3a3a4?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM006', marca: 'Aston Martin', modelo: 'DB11', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 200000, imagen: 'https://images.unsplash.com/photo-1549921296-3e9b6f8d1d43?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM007', marca: 'McLaren', modelo: '720S', categoria: 'Superdeportivo', tipo: 'Coupe', precio_venta: 300000, imagen: 'https://images.unsplash.com/photo-1517949908113-800c8a05f0b8?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM008', marca: 'Bugatti', modelo: 'Chiron', categoria: 'Hypercar', tipo: 'Coupe', precio_venta: 3000000, imagen: 'https://images.unsplash.com/photo-1542367597-7b0b90f4b3f3?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM009', marca: 'Mercedes-Benz', modelo: 'S-Class Maybach', categoria: 'Lujo', tipo: 'Sedán', precio_venta: 200000, imagen: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM010', marca: 'BMW', modelo: 'M8 Competition', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 130000, imagen: 'https://images.unsplash.com/photo-1517949908115-5ea7bfb1b7b1?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM011', marca: 'Tesla', modelo: 'Model S Plaid', categoria: 'Eléctrico', tipo: 'Sedán', precio_venta: 120000, imagen: 'https://images.unsplash.com/photo-1549924231-1a2a3b4c5d6e?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM012', marca: 'Audi', modelo: 'R8 V10', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 170000, imagen: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM013', marca: 'Jaguar', modelo: 'F-Type R', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 100000, imagen: 'https://images.unsplash.com/photo-1519038739623-2b8c58b8a8f3?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM014', marca: 'Lexus', modelo: 'LC 500', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 95000, imagen: 'https://images.unsplash.com/photo-1519791883280-d8e0bd5c5b7c?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM015', marca: 'Maserati', modelo: 'GranTurismo', categoria: 'Lujo', tipo: 'Coupe', precio_venta: 140000, imagen: 'https://images.unsplash.com/photo-1511296265587-2a9a9d2d6b6c?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM016', marca: 'Koenigsegg', modelo: 'Agera RS', categoria: 'Hypercar', tipo: 'Coupe', precio_venta: 2500000, imagen: 'https://images.unsplash.com/photo-1519885271235-1b8a6a2b9a6c?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM017', marca: 'Bentley', modelo: 'Bentayga', categoria: 'SUV de lujo', tipo: 'SUV', precio_venta: 220000, imagen: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM018', marca: 'Porsche', modelo: 'Taycan Turbo S', categoria: 'Eléctrico', tipo: 'Sedán', precio_venta: 185000, imagen: 'https://images.unsplash.com/photo-1549924231-8a1b2c3d4e5f?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM019', marca: 'BMW', modelo: 'i8', categoria: 'Híbrido', tipo: 'Coupe', precio_venta: 150000, imagen: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM020', marca: 'Ford', modelo: 'GT', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 500000, imagen: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=60' }
  ];

  // -------------------- LOCALSTORAGE (carrito) --------------------
  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem('garage_cart_v1');
      if (raw) cart = JSON.parse(raw) || [];
    } catch (e) {
      cart = [];
    }
  }
  function saveCartToStorage() {
    try {
      localStorage.setItem('garage_cart_v1', JSON.stringify(cart));
    } catch (e) {}
  }

  // -------------------- "CARGAR" VEHÍCULOS (simulado) --------------------
  async function loadVehicles() {
    try {
      showSpinner(true);
      // simulamos una pequeña latencia
      await new Promise(r => setTimeout(r, SIMULATED_LOAD_MS));
      vehiclesData = VEHICLES_STATIC.slice(); // copia
      displayVehicles(vehiclesData);
      loadError.classList.add('d-none');
    } catch (err) {
      console.error('Error cargando vehículos (local):', err);
      loadError.classList.remove('d-none');
      loadError.textContent = 'Error cargando los vehículos desde la lista local.';
      productsContainer.innerHTML = '';
    } finally {
      showSpinner(false);
    }
  }

  function showSpinner(show) {
    if (!loadingSpinner) return;
    loadingSpinner.style.display = show ? 'flex' : 'none';
    loadingSpinner.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  // -------------------- RENDERIZADO --------------------
  function displayVehicles(list) {
    productsContainer.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
      productsContainer.innerHTML = `<div class="col-12"><p class="text-muted">No hay vehículos que mostrar.</p></div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    list.forEach(vehicle => {
      const tipoClean = String(vehicle.tipo || '').replace(/[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

      const col = document.createElement('div');
      col.className = 'col-md-4 col-sm-6 mb-4';

      const card = document.createElement('div');
      card.className = 'card h-100';

      const imgWrapper = document.createElement('button');
      imgWrapper.className = 'btn p-0 border-0 viewDetailsBtn';
      imgWrapper.type = 'button';
      imgWrapper.dataset.codigo = String(vehicle.codigo);

      const img = document.createElement('img');
      img.className = 'card-img-top';
      img.src = vehicle.imagen || '';
      img.alt = `${vehicle.marca} ${vehicle.modelo}`;
      img.loading = 'lazy';
      img.style.height = '220px';
      img.style.objectFit = 'cover';

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
      const precio = Number(vehicle.precio_venta || 0);
      price.textContent = precio.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });

      const actions = document.createElement('div');
      actions.className = 'd-flex gap-2 mt-3';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary addToCartBtn';
      addBtn.type = 'button';
      addBtn.dataset.codigo = String(vehicle.codigo);
      addBtn.setAttribute('aria-label', `Añadir ${vehicle.marca} ${vehicle.modelo} al carrito`);
      addBtn.textContent = 'Añadir al Carrito';

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-outline-secondary viewDetailsBtn';
      viewBtn.type = 'button';
      viewBtn.dataset.codigo = String(vehicle.codigo);
      viewBtn.textContent = 'Ver detalle';

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
    addAddToCartListeners();
  }

  // -------------------- FILTRO --------------------
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

  // -------------------- CARRITO --------------------
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
    cartCount.classList.add('pulse');
    setTimeout(()=>cartCount.classList.remove('pulse'), 600);
  }

  function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    if (!cart.length) {
      cartItemsContainer.innerHTML = '<p class="text-muted">Tu carrito está vacío.</p>';
      cartCount.textContent = '0';
      if (cartTotalEl) cartTotalEl.textContent = formatPrice(0);
      return;
    }

    cart.forEach(item => {
      const subtotal = Number(item.precio || 0) * Number(item.quantity || 0);
      total += subtotal;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'd-flex align-items-center mb-3';
      itemDiv.setAttribute('role','listitem');

      const img = document.createElement('img');
      img.src = item.imagen || '';
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
      removeBtn.addEventListener('click', () => removeFromCart(item.codigo));

      const incBtn = document.createElement('button');
      incBtn.className = 'btn btn-sm btn-outline-secondary';
      incBtn.textContent = '+';
      incBtn.type = 'button';
      incBtn.addEventListener('click', () => changeQuantity(item.codigo, Number(item.quantity) + 1));

      const decBtn = document.createElement('button');
      decBtn.className = 'btn btn-sm btn-outline-secondary';
      decBtn.textContent = '-';
      decBtn.type = 'button';
      decBtn.addEventListener('click', () => changeQuantity(item.codigo, Math.max(1, Number(item.quantity) - 1)));

      actions.appendChild(decBtn);
      actions.appendChild(incBtn);
      actions.appendChild(removeBtn);

      itemDiv.appendChild(img);
      itemDiv.appendChild(info);
      itemDiv.appendChild(actions);

      cartItemsContainer.appendChild(itemDiv);
    });

    cartCount.textContent = cart.reduce((s,i)=>s+Number(i.quantity),0);
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(total);
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

  // -------------------- LISTENERS: añadir al carrito --------------------
  function addAddToCartListeners() {
    const addBtns = document.querySelectorAll('.addToCartBtn');
    addBtns.forEach(btn => {
      btn.removeEventListener('click', onAddBtnClick);
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

  // -------------------- EVENT DELEGATION: ver detalles --------------------
  productsContainer.addEventListener('click', (e) => {
    const target = e.target;
    const btn = target.closest('.viewDetailsBtn');
    if (!btn || !productsContainer.contains(btn)) return;
    const codigo = btn.dataset.codigo;
    if (!codigo) return;
    const vehicle = vehiclesData.find(v => String(v.codigo) === String(codigo));
    if (!vehicle) return;
    openDetailModal(vehicle);
  });

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

    detailAddToCart.onclick = () => {
      selectedVehicleForQuantity = vehicle;
      quantityInput.value = 1;
      bsDetailModal.hide();
      bsQuantityModal.show();
    };

    bsDetailModal.show();
  }

  // -------------------- PAGO + FACTURA (jsPDF) --------------------
  processPaymentBtn.addEventListener('click', async () => {
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

    // 1. CREAR COPIA DEL CARRITO
    const itemsToInvoice = JSON.parse(JSON.stringify(cart));

    try {
      // Simular éxito de pago
      alert('Pago procesado con éxito. Se generará la factura en PDF.');

      // 2. Generar factura PDF usando la copia
      generateInvoicePDF(name, itemsToInvoice);

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

  // -------------------- INICIALIZACIÓN --------------------
  loadCartFromStorage();
  updateCartUI();
  loadVehicles();
  searchInput.addEventListener('input', filterVehicles);

  // Exponer para debug
  window._garage = { vehiclesData, cart, addItemToCart, updateCartUI };

});
