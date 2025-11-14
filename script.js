/* script.js - lógica para GarageOnline
   - carga de vehículos desde JSON
   - renderizado de tarjetas
   - evento delegado para ver detalle
   - gestión de carrito con modal de cantidad
   - persistencia en localStorage
   - simulación de pago y generación de PDF con jsPDF
*/

document.addEventListener('DOMContentLoaded', () => {

  // URL CORREGIDA
  const DATA_URL = 'https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/main/vehiculos.json';

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
  const yearSpan = document.getElementById('year');

  // Modales Bootstrap
  const bsQuantityModal = new bootstrap.Modal(quantityModalEl, { keyboard: true, backdrop: 'static' });
  const bsDetailModal = new bootstrap.Modal(detailModalEl, { keyboard: true, backdrop: true });

  // Variables de estado
  let vehiclesData = [];
  let cart = [];
  let selectedVehicleForQuantity = null;
  let selectedVehicleForDetail = null;

  yearSpan.textContent = new Date().getFullYear();

  // -------------------- CARGAR CARRITO DESDE LOCALSTORAGE --------------------
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

  // -------------------- FETCH A VEHÍCULOS --------------------
  async function loadVehicles() {
    try {
      showSpinner(true);
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      vehiclesData = Array.isArray(data) ? data : (data.vehiculos || []);
      displayVehicles(vehiclesData);
    } catch (err) {
      console.error('Error cargando vehículos:', err);
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

  // -------------------- RENDERIZAR VEHÍCULOS --------------------
  function displayVehicles(list) {
    productsContainer.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
      productsContainer.innerHTML = `<p class="text-muted">No hay vehículos que mostrar.</p>`;
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
      imgWrapper.dataset.codigo = vehicle.codigo;

      const img = document.createElement('img');
      img.src = vehicle.imagen;
      img.className = 'card-img-top';
      img.loading = 'lazy';
      img.alt = `${vehicle.marca} ${vehicle.modelo}`;

      imgWrapper.appendChild(img);
      card.appendChild(imgWrapper);

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body d-flex flex-column';

      const title = document.createElement('h5');
      title.className = 'card-title';
      title.textContent = `${vehicle.marca} ${vehicle.modelo}`;

      const desc = document.createElement('p');
      desc.className = 'text-muted';
      desc.textContent = vehicle.categoria ? `${vehicle.categoria} • ${tipoClean}` : tipoClean;

      const price = document.createElement('p');
      price.className = 'fw-bold mt-auto';
      const precio = Number(vehicle.precio_venta || 0);
      price.textContent = precio.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });

      const actions = document.createElement('div');
      actions.className = 'd-flex gap-2 mt-3';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary addToCartBtn';
      addBtn.dataset.codigo = vehicle.codigo;
      addBtn.textContent = 'Añadir al Carrito';

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-outline-secondary viewDetailsBtn';
      viewBtn.dataset.codigo = vehicle.codigo;
      viewBtn.textContent = 'Ver detalle';

      actions.appendChild(addBtn);
      actions.appendChild(viewBtn);

      cardBody.appendChild(title);
      cardBody.appendChild(desc);
      cardBody.appendChild(price);
      cardBody.appendChild(actions);

      card.appendChild(cardBody);
      col.appendChild(card);
      fragment.appendChild(col);
    });

    productsContainer.appendChild(fragment);
    addAddToCartListeners();
  }

  // -------------------- FILTRO --------------------
  function filterVehicles() {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) return displayVehicles(vehiclesData);

    const filtered = vehiclesData.filter(v =>
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      String(v.categoria).toLowerCase().includes(q)
    );

    displayVehicles(filtered);
  }

  // -------------------- CARRITO --------------------
  function findCartIndexByCodigo(codigo) {
    return cart.findIndex(i => String(i.codigo) === String(codigo));
  }

  function addItemToCart(vehicle, quantity) {
    const idx = findCartIndexByCodigo(vehicle.codigo);
    if (idx >= 0) {
      cart[idx].quantity += quantity;
    } else {
      cart.push({
        codigo: vehicle.codigo,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        precio: Number(vehicle.precio_venta),
        imagen: vehicle.imagen,
        quantity
      });
    }
    saveCartToStorage();
    updateCartUI();

    cartCount.classList.add('pulse');
    setTimeout(() => cartCount.classList.remove('pulse'), 600);
  }

  function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `<p class="text-muted">Tu carrito está vacío.</p>`;
      cartCount.textContent = '0';
      cartTotalSpan.textContent = '$0.00';
      return;
    }

    cart.forEach(item => {
      const subtotal = item.precio * item.quantity;
      total += subtotal;

      const div = document.createElement('div');
      div.className = 'd-flex align-items-center mb-3';

      div.innerHTML = `
        <img src="${item.imagen}" style="width:80px;height:50px;object-fit:cover" class="me-3 rounded">
        <div class="flex-grow-1">
            <strong>${item.marca} ${item.modelo}</strong><br>
            <small class="text-muted">Cantidad: ${item.quantity} • Subtotal: ${formatPrice(subtotal)}</small>
        </div>
      `;

      const actions = document.createElement('div');
      actions.className = 'd-flex gap-2 ms-3';

      const decBtn = document.createElement('button');
      decBtn.className = 'btn btn-sm btn-outline-secondary';
      decBtn.textContent = '-';
      decBtn.onclick = () => changeQuantity(item.codigo, Math.max(1, item.quantity - 1));

      const incBtn = document.createElement('button');
      incBtn.className = 'btn btn-sm btn-outline-secondary';
      incBtn.textContent = '+';
      incBtn.onclick = () => changeQuantity(item.codigo, item.quantity + 1);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-sm btn-outline-danger';
      removeBtn.textContent = 'Eliminar';
      removeBtn.onclick = () => removeFromCart(item.codigo);

      actions.appendChild(decBtn);
      actions.appendChild(incBtn);
      actions.appendChild(removeBtn);
      div.appendChild(actions);

      cartItemsContainer.appendChild(div);
    });

    cartCount.textContent = cart.reduce((s, i) => s + i.quantity, 0);
    cartTotalSpan.textContent = formatPrice(total);
  }

  function changeQuantity(codigo, newQty) {
    const idx = findCartIndexByCodigo(codigo);
    if (idx >= 0) {
      cart[idx].quantity = newQty;
      saveCartToStorage();
      updateCartUI();
    }
  }

  function removeFromCart(codigo) {
    cart = cart.filter(i => String(i.codigo) !== String(codigo));
    saveCartToStorage();
    updateCartUI();
  }

  function formatPrice(v) {
    return Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'USD' });
  }

  // -------------------- LISTENERS BOTONES AÑADIR --------------------
  function addAddToCartListeners() {
    document.querySelectorAll('.addToCartBtn').forEach(btn => {
      btn.onclick = e => {
        const codigo = e.currentTarget.dataset.codigo;
        const vehicle = vehiclesData.find(v => String(v.codigo) === String(codigo));
        if (!vehicle) return;

        selectedVehicleForQuantity = vehicle;
        quantityInput.value = 1;
        bsQuantityModal.show();
      };
    });
  }

  addToCartBtn.onclick = () => {
    const q = Number(quantityInput.value);
    if (!selectedVehicleForQuantity || q <= 0) return;
    addItemToCart(selectedVehicleForQuantity, q);
    bsQuantityModal.hide();
  };

  // -------------------- DETALLES --------------------
  productsContainer.addEventListener('click', e => {
    const btn = e.target.closest('.viewDetailsBtn');
    if (!btn) return;

    const codigo = btn.dataset.codigo;
    const vehicle = vehiclesData.find(v => String(v.codigo) === String(codigo));
    if (!vehicle) return;

    openDetailModal(vehicle);
  });

  function openDetailModal(vehicle) {
    selectedVehicleForDetail = vehicle;

    detailImage.src = vehicle.imagen;
    detailImage.alt = `${vehicle.marca} ${vehicle.modelo}`;

    detailList.innerHTML = `
      <li class="list-group-item"><strong>Marca:</strong> ${vehicle.marca}</li>
      <li class="list-group-item"><strong>Modelo:</strong> ${vehicle.modelo}</li>
      <li class="list-group-item"><strong>Categoría:</strong> ${vehicle.categoria}</li>
      <li class="list-group-item"><strong>Tipo:</strong> ${vehicle.tipo}</li>
      <li class="list-group-item"><strong>Precio:</strong> ${formatPrice(vehicle.precio_venta)}</li>
      <li class="list-group-item"><strong>Código:</strong> ${vehicle.codigo}</li>
    `;

    detailAddToCart.onclick = () => {
      selectedVehicleForQuantity = vehicle;
      quantityInput.value = 1;
      bsDetailModal.hide();
      bsQuantityModal.show();
    };

    bsDetailModal.show();
  }

  // -------------------- PAGO + FACTURA PDF --------------------
  processPaymentBtn.onclick = async () => {
    const name = document.getElementById('payName').value.trim();
    const card = document.getElementById('payCard').value.trim();
    const exp = document.getElementById('payExp').value.trim();
    const cvv = document.getElementById('payCvv').value.trim();

    if (!name || !card || !exp || !cvv) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    if (!cart.length) {
      alert('El carrito está vacío.');
      return;
    }

    // HACEMOS UNA COPIA REAL DEL CARRITO
    const itemsToInvoice = JSON.parse(JSON.stringify(cart));

    try {
      alert('Pago procesado con éxito. Generando factura...');

      generateInvoicePDF(name, itemsToInvoice);

      // VACIA EL CARRITO DESPUÉS DE LA FACTURA
      cart = [];
      saveCartToStorage();
      updateCartUI();

      const paymentModalInstance = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
      if (paymentModalInstance) paymentModalInstance.hide();
      const cartModalInstance = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
      if (cartModalInstance) cartModalInstance.hide();

    } catch (e) {
      console.error(e);
      alert('Ocurrió un error generando la factura.');
    }
  };

  function generateInvoicePDF(clientName, itemsToInvoice) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(14);
      doc.text('GarageOnline', 14, 20);
      doc.text(`Factura para: ${clientName}`, 14, 28);
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 36);

      let y = 50;
      doc.setFontSize(10);
      doc.text('Items:', 14, y);
      y += 6;

      let total = 0;

      itemsToInvoice.forEach((it, idx) => {
        const subtotal = it.precio * it.quantity;
        total += subtotal;

        const line = `${idx + 1}. ${it.marca} ${it.modelo} — Cant.: ${it.quantity} — Subtotal: ${formatPrice(subtotal)}`;
        doc.text(line, 14, y);
        y += 6;

        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });

      y += 10;
      doc.setFontSize(12);
      doc.text(`Total: ${formatPrice(total)}`, 14, y);

      doc.save(`Factura-GarageOnline-${Date.now()}.pdf`);
    } catch (e) {
      console.error('PDF ERROR', e);
      alert('No se pudo generar la factura.');
    }
  }

  // Inicializaciones
  loadCartFromStorage();
  updateCartUI();
  loadVehicles();
  searchInput.addEventListener('input', filterVehicles);

});
