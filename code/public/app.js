const $ = (selector) => document.querySelector(selector);
const money = (value) => `${Number(value).toFixed(2)} บาท`;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character]));

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
  return data;
}

document.querySelectorAll("nav button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    button.classList.add("active");
    $(`#${button.dataset.panel}`).classList.add("active");
  });
});

let orderMenu = [];
const cart = new Map();

async function loadOrderMenu() {
  const branchId = $("#order-branch").value.trim();
  if (!branchId) return;
  try {
    orderMenu = await requestJson(`/api/menu/${encodeURIComponent(branchId)}`);
    $("#order-menu-grid").innerHTML = orderMenu.map((item) => `
      <article class="menu-card">
        <h3>${escapeHtml(item.name)}</h3>
        <p>${money(item.price)}</p>
        <p class="${item.stock_quantity < 10 ? "low-stock" : ""}">เหลือ ${item.stock_quantity}</p>
        <button data-add-menu="${escapeHtml(item.menu_id)}" ${item.stock_quantity === 0 ? "disabled" : ""}>เพิ่มลงตะกร้า</button>
      </article>
    `).join("");
  } catch (error) {
    $("#order-message").textContent = error.message;
  }
}

function renderCart() {
  const rows = [...cart.values()];
  $("#cart-items").innerHTML = rows.map((item) => `
    <tr><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td>
      <td>${money(item.price * item.quantity)}</td>
      <td><button data-remove-menu="${escapeHtml(item.menu_id)}">ลบ</button></td></tr>
  `).join("");
  $("#cart-total").textContent = money(rows.reduce((sum, item) => sum + item.price * item.quantity, 0));
  $("#submit-order").disabled = rows.length === 0;
}

$("#order-menu-grid").addEventListener("click", (event) => {
  const menuId = event.target.dataset.addMenu;
  if (!menuId) return;
  const menu = orderMenu.find((item) => item.menu_id === menuId);
  const item = cart.get(menuId) || { ...menu, quantity: 0 };
  if (item.quantity < menu.stock_quantity) item.quantity += 1;
  cart.set(menuId, item);
  renderCart();
});

$("#cart-items").addEventListener("click", (event) => {
  const menuId = event.target.dataset.removeMenu;
  if (menuId) cart.delete(menuId);
  renderCart();
});

$("#load-order-menu").addEventListener("click", loadOrderMenu);

$("#submit-order").addEventListener("click", async () => {
  try {
    const data = await requestJson("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId: $("#order-branch").value.trim(),
        cashierId: $("#order-cashier").value.trim(),
        paymentMethod: $("#payment-method").value,
        items: [...cart.values()].map((item) => ({ menuId: item.menu_id, quantity: item.quantity })),
      }),
    });
    $("#order-message").className = "message success";
    $("#order-message").textContent = `บันทึกสำเร็จ เลขที่ออเดอร์ ${data.orderId}`;
    cart.clear();
    renderCart();
    await loadOrderMenu();
  } catch (error) {
    $("#order-message").className = "message";
    $("#order-message").textContent = error.message;
  }
});

async function loadManageMenu() {
  const branchId = $("#manage-branch").value.trim();
  try {
    const items = await requestJson(`/api/menu/${encodeURIComponent(branchId)}`);
    $("#manage-menu-items").innerHTML = items.map((item) => `
      <tr><td>${escapeHtml(item.menu_id)}</td><td>${escapeHtml(item.name)}</td>
        <td>${money(item.price)}</td><td>${item.stock_quantity}</td>
        <td><button data-delete-menu="${escapeHtml(item.menu_id)}">ลบ</button></td></tr>
    `).join("");
  } catch (error) {
    $("#menu-message").textContent = error.message;
  }
}

$("#menu-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await requestJson("/api/menu/item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuId: $("#menu-id").value.trim(), branchId: $("#menu-branch").value.trim(),
        name: $("#menu-name").value.trim(), price: Number($("#menu-price").value),
        stockQuantity: Number($("#menu-stock").value),
      }),
    });
    $("#menu-message").className = "message success";
    $("#menu-message").textContent = "เพิ่มเมนูสำเร็จ";
    event.target.reset();
    $("#menu-branch").value = $("#manage-branch").value;
    await loadManageMenu();
  } catch (error) {
    $("#menu-message").className = "message";
    $("#menu-message").textContent = error.message;
  }
});

$("#load-manage-menu").addEventListener("click", loadManageMenu);
$("#manage-menu-items").addEventListener("click", async (event) => {
  const menuId = event.target.dataset.deleteMenu;
  if (!menuId || !window.confirm(`ลบเมนู ${menuId} หรือไม่`)) return;
  try {
    await requestJson(`/api/menu/item/${encodeURIComponent(menuId)}?branchId=${encodeURIComponent($("#manage-branch").value.trim())}`, { method: "DELETE" });
    await loadManageMenu();
  } catch (error) {
    $("#menu-message").textContent = error.message;
  }
});

$("#receipt-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await requestJson(`/api/orders/${$("#order-id").value}/receipt`);
    $("#receipt-id").textContent = data.orderId;
    $("#receipt-date").textContent = new Date(data.orderDate).toLocaleString("th-TH");
    $("#receipt-branch").textContent = data.branchId;
    $("#receipt-cashier").textContent = data.cashierId;
    $("#receipt-payment").textContent = data.paymentMethod;
    $("#receipt-items").innerHTML = data.items.map((item) => `
      <tr><td>${escapeHtml(item.menuName)}</td><td>${item.quantity} x ${money(item.unitPrice)}</td><td>${money(item.subtotal)}</td></tr>
    `).join("");
    $("#receipt-total").textContent = money(data.totalAmount);
    $("#receipt").hidden = false;
    $("#receipt-message").textContent = "";
  } catch (error) {
    $("#receipt-message").textContent = error.message;
  }
});

$("#print-button").addEventListener("click", () => window.print());
loadOrderMenu();
