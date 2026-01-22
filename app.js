/* ===== ELEMENTOS DOM ===== */
const drawer        = document.getElementById("drawer");
const search        = document.getElementById("search");
const list          = document.getElementById("list");
const ticketList    = document.getElementById("ticketList");
const confirmModal  = document.getElementById("confirmModal");
const confirmText   = document.getElementById("confirmText");
const addItemBtn    = document.getElementById("addItemBtn");
const editBtn       = document.getElementById("editBtn");

/* ===== MODO EDICIÓN ===== */
let editMode = false;

function toggleEditMode(){
  editMode = !editMode;
  render();
}

/* ===== CATEGORÍAS ===== */
const categories = [
  "Aguas y refrescos",
  "Cerveza, vinos y licores",
  "Café y té",
  "Frutas y verduras",
  "Lácteos y huevos",
  "Carne",
  "Pescado",
  "Limpieza",
  "Congelados",
  "Asiático",
  "Otros"
];

let activeCat = categories[0];
let items = JSON.parse(localStorage.items || "[]");
let cart  = JSON.parse(localStorage.cart  || "[]");

let deleteIndex = null;
let deleteType  = null;

/* ===== DRAWER ===== */
function toggleDrawer(){
  drawer.classList.toggle("open");
}

function renderDrawer(){
  drawer.innerHTML = categories.map(c => `
    <button class="${c === activeCat ? "active" : ""}"
      onclick="activeCat='${c}';toggleDrawer();render()">
      ${c}
    </button>
  `).join("");
}

/* ===== RENDER PRINCIPAL ===== */
function render(){

  if(editMode){
    addItemBtn.style.display = "block";
    editBtn.textContent = "↩️ Volver";
  }else{
    addItemBtn.style.display = "none";
    editBtn.textContent = "✏️ Editar";
  }

  renderDrawer();

  const q = search.value.toLowerCase();

  list.innerHTML = items
    .filter(i =>
      q
        ? i.name.toLowerCase().includes(q)
        : i.cat === activeCat
    )
    .map((i, idx) => `
      <div class="item">
        <div>
          <strong>${i.name}</strong>
          ${q ? `<div style="font-size:12px;opacity:.6">${i.cat}</div>` : ""}
        </div>
        <div>
          ${
            editMode
              ? `<button class="del" onclick="askDeleteItem(${idx})">✕</button>`
              : `<button class="add" onclick="showQtyModal('${i.name}')">+</button>`
          }
        </div>
      </div>
    `).join("");

  renderTicket();

  localStorage.items = JSON.stringify(items);
  localStorage.cart  = JSON.stringify(cart);
}

/* ===== NUEVO ARTÍCULO ===== */
function showAddItem(){
  const m = document.createElement("div");
  m.className = "modal";
  m.style.display = "flex";
  m.innerHTML = `
    <div class="box">
      <h3>Nuevo artículo</h3>
      <input id="iname" placeholder="Nombre">
      <select id="icat">
        ${categories.map(c => `<option>${c}</option>`).join("")}
      </select>
      <div>
        <button id="save" class="btn-green">Guardar</button>
        <button id="cancel" class="btn-red">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);

  m.querySelector("#cancel").onclick = () => m.remove();
  m.querySelector("#save").onclick = () => {
    const n = m.querySelector("#iname").value.trim();
    const c = m.querySelector("#icat").value;
    if(n){
      items.push({ name: n, cat: c });
      m.remove();
      render();
    }
  };
}

/* ===== MODAL CANTIDAD / UNIDAD ===== */
function showQtyModal(name){
  let qty = 1;
  let unit = "UNIDAD";

  const m = document.createElement("div");
  m.className = "modal";
  m.style.display = "flex";
  m.innerHTML = `
    <div class="box">
      <h3>${name}</h3>

      <p>Cantidad</p>
      <div class="btns qty">
        ${[1,2,3,4,5,6,7,8,9,10].map(n => `<button>${n}</button>`).join("")}
      </div>

      <p>Unidad</p>
      <div class="btns unit">
        <button class="active">UNIDAD</button>
        <button>KG</button>
        <button>CAJA</button>
      </div>

      <div>
        <button id="add" class="btn-green">Añadir</button>
        <button id="cancel" class="btn-red">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);

  m.querySelectorAll(".qty button").forEach(b => {
    b.onclick = () => {
      m.querySelectorAll(".qty button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      qty = +b.textContent;
    };
  });

  m.querySelectorAll(".unit button").forEach(b => {
    b.onclick = () => {
      m.querySelectorAll(".unit button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      unit = b.textContent;
    };
  });

  m.querySelector("#cancel").onclick = () => m.remove();
  m.querySelector("#add").onclick = () => {
    const found = cart.find(c => c.name === name && c.unit === unit);
    if(found) found.qty += qty;
    else cart.push({ name, qty, unit });
    m.remove();
    render();
  };
}

/* ===== TICKET ===== */
function renderTicket(){
  ticketList.innerHTML = cart.map((c, i) => `
    <li>
      ${c.name} - ${c.qty} ${c.unit}
      <button class="del" onclick="askDeleteTicket(${i})">✕</button>
    </li>
  `).join("");
}

/* ===== ELIMINAR ===== */
function askDeleteItem(i){
  deleteType = "item";
  deleteIndex = i;
  confirmText.textContent = `¿Eliminar ${items[i].name}?`;
  confirmModal.style.display = "flex";
}

function askDeleteTicket(i){
  deleteType = "ticket";
  deleteIndex = i;
  confirmText.textContent = `¿Eliminar ${cart[i].name}?`;
  confirmModal.style.display = "flex";
}

function confirmDelete(){
  if(deleteType === "item") items.splice(deleteIndex, 1);
  if(deleteType === "ticket") cart.splice(deleteIndex, 1);
  closeConfirm();
  render();
}

function closeConfirm(){
  confirmModal.style.display = "none";
}

function resetTicket(){
  cart = [];
  render();
}

/* ===== WHATSAPP ===== */
function buildWhatsAppText(){
  let txt = "🧾 *PEDIDO*\n\n";
  categories.forEach(cat => {
    const lines = cart.filter(c => {
      const it = items.find(i => i.name === c.name);
      return it && it.cat === cat;
    });
    if(lines.length){
      txt += cat.toUpperCase() + "\n";
      lines.forEach(l => {
        txt += `- ${l.name}: ${l.qty} ${l.unit}\n`;
      });
      txt += "\n";
    }
  });
  return txt.trim();
}

function previewWhatsApp(){
  const m = document.createElement("div");
  m.className = "modal";
  m.style.display = "flex";
  m.innerHTML = `
    <div class="box">
      <h3>Vista previa WhatsApp</h3>
      <textarea style="width:100%;height:200px">${buildWhatsAppText()}</textarea>
      <div>
        <button id="cancel" class="btn-red">Cancelar</button>
        <button id="send" class="btn-green">Enviar</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);

  m.querySelector("#cancel").onclick = () => m.remove();
  m.querySelector("#send").onclick = () => {
    const txt = m.querySelector("textarea").value;
    window.open("https://wa.me/?text=" + encodeURIComponent(txt));
    m.remove();
  };
}

function sendWhatsApp(){
  previewWhatsApp();
}

/* ===== DATOS INICIALES ===== */
if(items.length === 0){
  items = [
    { name: "Coca Cola", cat: "Aguas y refrescos" },
    { name: "Manzana",  cat: "Frutas y verduras" }
  ];
}

render();
