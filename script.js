/* script.js - lógica para Signature Motors
   - vehículos embebidos (20 de alta gama)
   - renderizado de tarjetas
   - evento delegado para ver detalle
   - gestión de carrito con modal de cantidad
   - persistencia en localStorage
   - simulación de pago y generación de PDF con jsPDF
*/

document.addEventListener('DOMContentLoaded', () => {

  // ---------- CONFIG ----------
  const SIMULATED_LOAD_MS = 600; // tiempo de "carga" para mostrar el spinner

  // Elementos del DOM
  const productsContainer = document.getElementById('productsContainer');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const loadError = document.getElementById('loadError');
  const searchInput = document.getElementById('searchInput');
  const cartCount = document.getElementById('cartCount');
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotalElement');
  const quantityModalEl = document.getElementById('quantityModal');
  const quantityInput = document.getElementById('quantityInput');
  const addToCartBtn = document.getElementById('addToCartBtn');
  const detailModalEl = document.getElementById('detailModal');
  const detailImage = document.getElementById('detailImage');
  const detailList = document.getElementById('detailList');
  const detailAddToCart = document.getElementById('detailAddToCart');
  const processPaymentBtn = document.getElementById('processPaymentBtn');
  const yearSpan = document.getElementById('year');
  const paymentForm = document.getElementById('paymentForm');

  // Modales Bootstrap
  const bsQuantityModal = new bootstrap.Modal(quantityModalEl);
  const bsDetailModal = new bootstrap.Modal(detailModalEl);
  const bsPaymentModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('paymentModal'));


  // Estado
  let vehiclesData = [];
  let cart = [];
  let selectedVehicleForQuantity = null;
  let selectedVehicleForDetail = null;

  yearSpan.textContent = new Date().getFullYear();

  // -------------------- VEHÍCULOS EMBEBIDOS (20 alta gama) --------------------
  // Se utiliza el JSON que proporcionaste con la estructura original.
  const VEHICLES_STATIC = [
    { codigo: 'VM001', marca: 'Lamborghini', modelo: 'Huracán EVO', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 280000, imagen: 'https://images.unsplash.com/photo-1603386329225-868f9c20b76c?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM002', marca: 'Ferrari', modelo: '812 Superfast', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 335000, imagen: 'https://images.unsplash.com/photo-1603386329291-94510cc1cbd5?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM003', marca: 'Porsche', modelo: '911 Turbo S', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 220000, imagen: 'https://images.unsplash.com/photo-1618841509808-5e66e4ae79e2?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM004', marca: 'Bentley', modelo: 'Continental GT', categoria: 'Lujo', tipo: 'Coupe', precio_venta: 240000, imagen: 'https://images.unsplash.com/photo-1617814076426-ae21b6a3e0e3?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM005', marca: 'Rolls-Royce', modelo: 'Phantom', categoria: 'Lujo', tipo: 'Sedán', precio_venta: 455000, imagen: 'https://images.unsplash.com/photo-1617813174484-4e4d35e3f1ba?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM006', marca: 'Aston Martin', modelo: 'DB11', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 200000, imagen: 'https://images.unsplash.com/photo-1603386321038-e5c51cae6afe?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM007', marca: 'McLaren', modelo: '720S', categoria: 'Superdeportivo', tipo: 'Coupe', precio_venta: 300000, imagen: 'https://images.unsplash.com/photo-1617814076510-b34cce62d54b?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM008', marca: 'Bugatti', modelo: 'Chiron', categoria: 'Hypercar', tipo: 'Coupe', precio_venta: 3000000, imagen: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM009', marca: 'Mercedes-Benz', modelo: 'S-Class Maybach', categoria: 'Lujo', tipo: 'Sedán', precio_venta: 200000, imagen: 'https://images.unsplash.com/photo-1617814076619-fb811fc7ba34?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM010', marca: 'BMW', modelo: 'M8 Competition', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 130000, imagen: 'https://images.unsplash.com/photo-1617814076626-740b93ebcb7d?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM011', marca: 'Tesla', modelo: 'Model S Plaid', categoria: 'Eléctrico', tipo: 'Sedán', precio_venta: 120000, imagen: 'https://images.unsplash.com/photo-1617814076452-eb4f5bd2a96d?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM012', marca: 'Audi', modelo: 'R8 V10', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 170000, imagen: 'https://images.unsplash.com/photo-1617814076518-8ad8752f4dd5?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM013', marca: 'Jaguar', modelo: 'F-Type R', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 100000, imagen: 'https://images.unsplash.com/photo-1617814076578-5ae0e21978b9?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM014', marca: 'Lexus', modelo: 'LC 500', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 95000, imagen: 'https://images.unsplash.com/photo-1617813076676-309b3debd4a5?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM015', marca: 'Maserati', modelo: 'GranTurismo', categoria: 'Lujo', tipo: 'Coupe', precio_venta: 140000, imagen: 'https://images.unsplash.com/photo-1617813076505-67fa8ce28ed5?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM016', marca: 'Koenigsegg', modelo: 'Agera RS', categoria: 'Hypercar', tipo: 'Coupe', precio_venta: 2500000, imagen: 'https://images.unsplash.com/photo-1617814076408-b6e2274fd51a?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM017', marca: 'Bentley', modelo: 'Bentayga', categoria: 'SUV de lujo', tipo: 'SUV', precio_venta: 220000, imagen: 'https://images.unsplash.com/photo-1617813076447-824a1820e5c2?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM018', marca: 'Porsche', modelo: 'Taycan Turbo S', categoria: 'Eléctrico', tipo: 'Sedán', precio_venta: 185000, imagen: 'https://images.unsplash.com/photo-1617814076468-50a6481d948e?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM019', marca: 'BMW', modelo: 'i8', categoria: 'Híbrido', tipo: 'Coupe', precio_venta: 150000, imagen: 'https://images.unsplash.com/photo-1617814076526-4620f0f5508e?auto=format&fit=crop&w=1200&q=60' },
    { codigo: 'VM020', marca: 'Ford', modelo: 'GT', categoria: 'Deportivo', tipo: 'Coupe', precio_venta: 500000, imagen: 'https://images.unsplash.com/photo-1617814076348-058ae114cf8e?auto=format&fit=crop&w=1200&q=60' }
  ];

  // -------------------- LOCALSTORAGE --------------------
  function loadCartFromStorage() {
    try {
      const raw = localStorage.getItem('garage_cart_v1');
      if (raw) cart = JSON.parse(raw) || [];
    } catch (e) { cart = []; }
  }
  function saveCartToStorage() {
    try { localStorage.setItem('garage_cart_v1', JSON.stringify(cart)); } catch (e) {}
  }

  // -------------------- "CARGAR" VEHÍCULOS --------------------
  async function loadVehicles() {
    try {
      showSpinner(true);
      // Simulación de retraso de red
      await new Promise(r => setTimeout(r, SIMULATED_LOAD_MS));
      
      vehiclesData = VEHICLES_STATIC.slice();
      displayVehicles(vehiclesData);
      loadError.classList.add('d-none');
    } catch (err) {
      console.error(err);
      loadError.classList.remove('d-none');
      loadError.textContent = 'Error cargando los vehículos.';
      productsContainer.innerHTML = '';
    } finally {
      showSpinner(false);
    }
  }

  function showSpinner(show) {
    if (!loadingSpinner) return;
    loadingSpinner.style.display = show ? 'flex' : 'none';
  }

  // -------------------- RENDERIZADO --------------------
  function displayVehicles(list) {
    productsContainer.innerHTML = '';
    if (!Array.isArray(list) || !list.length) {
      productsContainer.innerHTML = `<div class="col-12"><p class="text-muted">No hay vehículos que mostrar.</p></div>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    list.forEach(vehicle => {
      const col = document.createElement('div');
      col.className = 'col-md-4 col-sm-6 mb-4';

      const card = document.createElement('div');
      card.className = 'card h-100';

      // Utilizamos el botón de imagen para abrir los detalles (Delegado)
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
      desc.textContent = `${vehicle.categoria} • ${vehicle.tipo}`;

      const price = document.createElement('p');
      price.className = 'fw-bold mt-auto';
      price.textContent = formatPrice(vehicle.precio_venta || 0);

      const actions = document.createElement('div');
      actions.className = 'd-flex gap-2 mt-3';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-primary addToCartBtn';
      addBtn.type = 'button';
      addBtn.dataset.codigo = vehicle.codigo;
      addBtn.textContent = 'Añadir al Carrito';

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn btn-outline-secondary viewDetailsBtn';
      viewBtn.type = 'button';
      viewBtn.dataset.codigo = vehicle.codigo;
      viewBtn.textContent = 'Ver detalle';

      actions.append(addBtn, viewBtn);
      cardBody.append(title, desc, price, actions);
      card.append(imgWrapper, cardBody);
      col.appendChild(card);
      fragment.appendChild(col);
    });

    productsContainer.appendChild(fragment);
  }

  // -------------------- FILTRO --------------------
  function filterVehicles() {
    const q = (searchInput.value || '').trim().toLowerCase();
    if (!q) { displayVehicles(vehiclesData); return; }
    const filtered = vehiclesData.filter(v =>
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      v.categoria.toLowerCase().includes(q)
    );
    displayVehicles(filtered);
  }

  // -------------------- LÓGICA DE CARRITO --------------------
  function findCartIndexByCodigo(codigo) {
    return cart.findIndex(i => String(i.codigo) === String(codigo));
  }

  function addItemToCart(vehicle, quantity) {
    const idx = findCartIndexByCodigo(vehicle.codigo);
    const qty = Number(quantity);
    if (qty < 1) return;

    if (idx >= 0) {
      cart[idx].quantity += qty;
    } else {
      cart.push({
        codigo: vehicle.codigo,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        precio: Number(vehicle.precio_venta || 0),
        imagen: vehicle.imagen || '',
        quantity: qty
      });
    }
    saveCartToStorage();
    updateCartUI();
    // Animación de pulso
    cartCount.classList.add('pulse');
    setTimeout(()=>cartCount.classList.remove('pulse'), 600);
  }

  function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    const checkoutBtn = document.getElementById('checkoutBtn');
    // Deshabilitar el botón de pagar si el carrito está vacío
    if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

    if (!cart.length) {
      cartItemsContainer.innerHTML = '<p class="text-muted">Tu carrito está vacío.</p>';
      cartCount.textContent = '0';
      if (cartTotalEl) cartTotalEl.textContent = formatPrice(0);
      return;
    }

    cart.forEach(item => {
      const subtotal = item.precio * item.quantity;
      total += subtotal;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'd-flex align-items-center mb-3 p-2 border-bottom';

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

      // Botones con data-codigo para manejo delegado
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-sm btn-outline-danger removeCartItem';
      removeBtn.textContent = 'Eliminar';
      removeBtn.type = 'button';
      removeBtn.dataset.codigo = item.codigo;

      const incBtn = document.createElement('button');
      incBtn.className = 'btn btn-sm btn-outline-secondary increaseQty';
      incBtn.textContent = '+';
      incBtn.type = 'button';
      incBtn.dataset.codigo = item.codigo;
      
      const decBtn = document.createElement('button');
      decBtn.className = 'btn btn-sm btn-outline-secondary decreaseQty';
      decBtn.textContent = '-';
      decBtn.type = 'button';
      decBtn.dataset.codigo = item.codigo;

      actions.append(decBtn, incBtn, removeBtn);
      itemDiv.append(img, info, actions);
      cartItemsContainer.appendChild(itemDiv);
    });

    cartCount.textContent = cart.reduce((s,i)=>s+i.quantity,0);
    if (cartTotalEl) cartTotalEl.textContent = formatPrice(total);
  }

  function removeFromCart(codigo) {
    cart = cart.filter(i => String(i.codigo) !== String(codigo));
    saveCartToStorage();
    updateCartUI();
  }

  function changeQuantity(codigo, newQty) {
    const qty = Number(newQty);
    if (qty < 1) {
      removeFromCart(codigo);
      return;
    }
    const idx = findCartIndexByCodigo(codigo);
    if (idx >= 0) {
      cart[idx].quantity = qty;
      saveCartToStorage();
      updateCartUI();
    }
  }

  function formatPrice(v) {
    return Number(v || 0).toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // -------------------- DETALLE DEL VEHÍCULO --------------------
  function showVehicleDetails(codigo) {
    const vehicle = vehiclesData.find(v => String(v.codigo) === String(codigo));
    if (!vehicle) return;

    selectedVehicleForDetail = vehicle;

    // Rellenar modal
    detailImage.src = vehicle.imagen || '';
    detailImage.alt = `${vehicle.marca} ${vehicle.modelo}`;

    // Se añaden algunas propiedades de ejemplo para el listado de detalles
    detailList.innerHTML = `
      <li class="list-group-item"><strong>Marca:</strong> ${vehicle.marca}</li>
      <li class="list-group-item"><strong>Modelo:</strong> ${vehicle.modelo}</li>
      <li class="list-group-item"><strong>Categoría:</strong> ${vehicle.categoria}</li>
      <li class="list-group-item"><strong>Tipo:</strong> ${vehicle.tipo}</li>
      <li class="list-group-item list-group-item-success fs-4"><strong>Precio:</strong> ${formatPrice(vehicle.precio_venta)}</li>
    `;

    detailAddToCart.dataset.codigo = vehicle.codigo;
    bsDetailModal.show();
  }

  // -------------------- GENERACIÓN DE PDF --------------------
  function generateReceiptPDF(customerName, total) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Recibo de Compra - SignatureMotors", 15, 20);

    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 30);
    doc.text(`Cliente: ${customerName}`, 15, 37);

    let y = 50;
    doc.setFontSize(14);
    doc.text("Detalle de Vehículos:", 15, y);
    y += 7;

    cart.forEach(item => {
      const subtotal = item.precio * item.quantity;
      doc.setFontSize(10);
      doc.text(`${item.quantity}x ${item.marca} ${item.modelo}`, 15, y);
      doc.text(formatPrice(subtotal), 180, y, { align: "right" });
      y += 5;
    });

    y += 5;
    doc.line(15, y, 195, y); // Línea separadora
    y += 7;

    doc.setFontSize(16);
    doc.text("TOTAL PAGADO:", 15, y);
    doc.text(formatPrice(total), 180, y, { align: "right" });

    doc.save(`Recibo_SignatureMotors_${Date.now()}.pdf`);
  }

  // -------------------- MANEJO DE EVENTOS --------------------

  // 1. Manejo de clic para las tarjetas (delegación)
  productsContainer.addEventListener('click', (e) => {
    const target = e.target.closest('.addToCartBtn') || e.target.closest('.viewDetailsBtn');
    if (!target) return;
    
    const codigo = target.dataset.codigo;
    
    if (target.classList.contains('addToCartBtn')) {
      const vehicle = vehiclesData.find(v => v.codigo === codigo);
      if (!vehicle) return;
      
      selectedVehicleForQuantity = vehicle;
      quantityInput.value = 1;
      bsQuantityModal.show();
    }

    if (target.classList.contains('viewDetailsBtn')) {
      showVehicleDetails(codigo);
    }
  });

  // 2. Manejo de clic para añadir al carrito (desde modal de detalle)
  detailAddToCart.addEventListener('click', (e) => {
    if (!selectedVehicleForDetail) return;
    
    bsDetailModal.hide();
    selectedVehicleForQuantity = selectedVehicleForDetail;
    quantityInput.value = 1;
    bsQuantityModal.show();
  });

  // 3. Clic en "Añadir al carrito" del modal de cantidad (CORREGIDO)
  addToCartBtn.addEventListener('click', () => {
    if (!selectedVehicleForQuantity) return;

    const quantity = parseInt(quantityInput.value, 10);
    if (isNaN(quantity) || quantity < 1) return alert('La cantidad debe ser 1 o más.');

    addItemToCart(selectedVehicleForQuantity, quantity);
    bsQuantityModal.hide();
    selectedVehicleForQuantity = null;
  });

  // 4. Búsqueda
  searchInput.addEventListener('input', filterVehicles);

  // 5. Modificar cantidad en el carrito (delegación)
  cartItemsContainer.addEventListener('click', (e) => {
    const target = e.target;
    const codigo = target.dataset.codigo;
    if (!codigo) return;

    const item = cart.find(i => String(i.codigo) === String(codigo));
    if (!item) return;

    if (target.classList.contains('increaseQty')) {
      changeQuantity(codigo, item.quantity + 1);
    } else if (target.classList.contains('decreaseQty')) {
      changeQuantity(codigo, item.quantity - 1);
    } else if (target.classList.contains('removeCartItem')) { // Asegúrate de usar la clase correcta
      removeFromCart(codigo);
    }
  });

  // 6. Proceso de Pago
  processPaymentBtn.addEventListener('click', () => {
    if (!paymentForm.checkValidity()) {
      paymentForm.classList.add('was-validated');
      return;
    }
    
    const name = document.getElementById('payName').value;
    const total = cart.reduce((s,i)=>s + (i.precio * i.quantity), 0);

    generateReceiptPDF(name, total);

    // Reset
    cart = [];
    saveCartToStorage();
    updateCartUI();
    paymentForm.reset();
    paymentForm.classList.remove('was-validated');

    bsPaymentModal.hide();
    alert(`¡Pago de ${formatPrice(total)} procesado con éxito! Se ha generado tu recibo en PDF.`);
  });


  // -------------------- INICIALIZACIÓN --------------------
  loadCartFromStorage();
  updateCartUI();
  loadVehicles();
});
