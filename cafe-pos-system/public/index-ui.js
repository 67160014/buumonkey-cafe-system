(async () => {
  const branchStorageKey = "cafe-pos-branch-id";
  const cashierStorageKey = "cafe-pos-cashier-id";
  let branchId = "";
  let cashierId = "";
  const branchSelect = document.querySelector("#branch-select");
  const cashierSelect = document.querySelector("#cashier-select");
  const orderStatus = document.querySelector("#order-status");
  const confirmOrderButton = document.querySelector("#confirm-order-button");
  const cart = new Map();
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
  const money = (value) => Number(value).toFixed(2);
  let orderInProgress = false;
  function showOrderStatus(message, isError = false) {
    orderStatus.textContent = message;
    orderStatus.classList.toggle("hidden", !message);
    orderStatus.classList.toggle("text-rose-600", isError);
    orderStatus.classList.toggle("text-emerald-700", !isError);
  }
  const catalog = document.querySelector("#catalog-container");
  if (catalog) catalog.replaceChildren();
  document.querySelector("#cart-item-count").textContent = "0 แก้ว";
  document.querySelector("#cart-total").textContent = "0.00";
  document.querySelector("#confirm-btn-label").textContent = "ยืนยันออเดอร์";

  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
    return data;
  }

  function renderCart() {
    const list = document.querySelector("#cart-items");
    if (!list) return;
    if (!list.dataset.bound) {
      list.dataset.bound = "true";
      list.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const delta = button.dataset.action === "increase"
          ? 1
          : button.dataset.action === "decrease" ? -1 : 0;
        if (button.dataset.action === "remove") window.removeItem(button.dataset.id);
        else window.updateQty(button.dataset.id, delta);
      });
    }
    list.replaceChildren();
    let total = 0;
    let count = 0;
    for (const item of cart.values()) {
      const subtotal = Number(item.price) * item.qty;
      total += subtotal;
      count += item.qty;
      const row = document.createElement("div");
      row.className = "grid grid-cols-12 items-center py-2.5 px-3 rounded-xl bg-stone-50/70 text-sm";
      row.innerHTML = `
        <div class="col-span-5 min-w-0 font-semibold text-stone-800"><span class="block">${escapeHtml(item.name)}</span></div>
        <div class="col-span-3 flex items-center justify-center space-x-1.5">
          <button class="w-6 h-6 rounded-lg bg-white shadow-xs" data-action="decrease" data-id="${escapeHtml(item.menu_id)}">−</button>
          <span class="font-bold w-4 text-center">${item.qty}</span>
          <button class="w-6 h-6 rounded-lg bg-white shadow-xs" data-action="increase" data-id="${escapeHtml(item.menu_id)}">+</button>
        </div>
        <div class="col-span-2 text-right font-bold">${money(subtotal)} ฿</div>
        <div class="col-span-2 text-right"><button data-action="remove" data-id="${escapeHtml(item.menu_id)}">ลบ</button></div>`;
      list.appendChild(row);
    }
    document.querySelector("#cart-item-count").textContent = `${count} แก้ว`;
    document.querySelector("#cart-total").textContent = money(total);
    document.querySelector("#confirm-btn-label").textContent = "ยืนยันออเดอร์";
  }

  async function loadMenu() {
    const items = await request(`/api/menu/${encodeURIComponent(branchId)}`);
    document.querySelectorAll("[data-menu-total-count]").forEach((element) => {
      element.textContent = items.length;
    });
    if (items.length === 0) {
      catalog.innerHTML = '<p class="text-sm text-stone-500">ไม่พบเมนูของสาขานี้</p>';
      return;
    }

    catalog.innerHTML = items.map((item) => `
      <div class="group bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
        <div class="flex items-start justify-between"><div class="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">☕</div>
          <span class="text-xs ${item.stock_quantity < 10 ? "bg-amber-100 text-amber-900" : "text-stone-400 bg-stone-50"} px-2 py-0.5 rounded-lg">
            ${item.stock_quantity < 10 ? "⚠️ " : ""}เหลือ ${item.stock_quantity} แก้ว</span></div>
        <div><h3 class="font-bold text-stone-900">${escapeHtml(item.name)}</h3></div>
        <div class="flex items-center justify-between"><span class="text-base font-normal">${money(item.price)} บาท</span>
          <button class="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs" data-add="${escapeHtml(item.menu_id)}"
            ${item.stock_quantity === 0 ? "disabled" : ""}>เพิ่ม</button></div>
      </div>`).join("");
    catalog.style.visibility = "visible";
    catalog.querySelectorAll("[data-add]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items.find((menu) => menu.menu_id === button.dataset.add);
        const current = cart.get(item.menu_id) || { ...item, qty: 0 };
        if (current.qty < item.stock_quantity) current.qty += 1;
        cart.set(item.menu_id, current);
        renderCart();
      });
    });
  }

  async function loadBranches() {
    const branches = await request("/api/branches");
    branchSelect.replaceChildren(...branches.map((branch) => {
      const option = document.createElement("option");
      option.value = branch.branch_id;
      option.textContent = branch.name;
      return option;
    }));
    if (!branches.length) throw new Error("ไม่พบข้อมูลสาขา");
    const savedBranchId = localStorage.getItem(branchStorageKey);
    branchId = branches.some((branch) => branch.branch_id === savedBranchId)
      ? savedBranchId
      : branches.find((branch) => branch.branch_id === "B001")?.branch_id || branches[0].branch_id;
    branchSelect.value = branchId;
    localStorage.setItem(branchStorageKey, branchId);
  }

  async function loadCashiers() {
    const cashiers = await request(`/api/branches/${encodeURIComponent(branchId)}/cashiers`);
    cashierSelect.replaceChildren(...cashiers.map((cashier) => {
      const option = document.createElement("option");
      option.value = cashier.cashier_id;
      option.textContent = cashier.name;
      return option;
    }));
    const savedCashierId = localStorage.getItem(cashierStorageKey);
    cashierId = cashiers.some((cashier) => cashier.cashier_id === savedCashierId)
      ? savedCashierId
      : cashiers[0]?.cashier_id || "";
    cashierSelect.value = cashierId;
    cashierSelect.disabled = cashiers.length === 0;
    if (cashierId) localStorage.setItem(cashierStorageKey, cashierId);
  }

  window.updateQty = (menuId, delta) => {
    const item = cart.get(menuId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart.delete(menuId);
    renderCart();
  };
  window.removeItem = (menuId) => { cart.delete(menuId); renderCart(); };
  window.clearCart = () => {
    cart.clear();
    showOrderStatus("");
    renderCart();
  };
  window.confirmOrder = async () => {
    const items = [...cart.values()].map((item) => ({ menuId: item.menu_id, quantity: item.qty }));
    if (orderInProgress) return;
    if (!items.length) {
      showOrderStatus("กรุณาเลือกเมนูอย่างน้อย 1 รายการ", true);
      return;
    }
    orderInProgress = true;
    confirmOrderButton.disabled = true;
    showOrderStatus("");
    try {
      const paymentMethod = document.querySelector("input[name='payment_method']:checked")?.value || "cash";
      if (!cashierId) throw new Error("ไม่พบพนักงานของสาขาที่เลือก");
      const result = await request("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, cashierId, paymentMethod, items }),
      });
      showOrderStatus(`บันทึกออเดอร์สำเร็จ เลขที่ ${result.orderId}`);
      cart.clear();
      renderCart();
      await loadMenu();
    } catch (error) {
      showOrderStatus(error.message, true);
    } finally {
      orderInProgress = false;
      confirmOrderButton.disabled = false;
    }
  };

  branchSelect.addEventListener("change", async () => {
    const previousBranchId = branchId;
    branchId = branchSelect.value;
    localStorage.setItem(branchStorageKey, branchId);
    const hadItems = cart.size > 0;
    cart.clear();
    renderCart();
    showOrderStatus(hadItems ? "เปลี่ยนสาขา" : "");
    branchSelect.disabled = true;
    cashierSelect.disabled = true;
    try {
      await loadCashiers();
      await loadMenu();
    } catch (error) {
      branchId = previousBranchId;
      branchSelect.value = previousBranchId;
      localStorage.setItem(branchStorageKey, previousBranchId);
      showOrderStatus(`เปลี่ยนสาขาไม่สำเร็จ: ${error.message}`, true);
      try {
        await loadCashiers();
        await loadMenu();
      } catch (reloadError) {
        showOrderStatus(
          `เปลี่ยนสาขาไม่สำเร็จ: ${error.message} และโหลดข้อมูลสาขาเดิมไม่สำเร็จ: ${reloadError.message}`,
          true,
        );
      }
    } finally {
      branchSelect.disabled = false;
      cashierSelect.disabled = cashierSelect.options.length === 0;
    }
  });

  cashierSelect.addEventListener("change", () => {
    cashierId = cashierSelect.value;
    if (cashierId) localStorage.setItem(cashierStorageKey, cashierId);
  });

  document.querySelectorAll("a").forEach((link) => {
    const label = link.textContent.trim();
    if (label.includes("จัดการเมนู")) link.href = "/menu.html";
    if (label.includes("รายงานยอดขาย")) link.href = "/report.html";
    if (label.includes("ประวัติใบเสร็จ")) link.href = "/receipt.html";
  });

  try {
    await loadBranches();
    await loadCashiers();
    await loadMenu();
    renderCart();
    document.querySelector("#pos-main-content").style.visibility = "visible";
  } catch (error) {
    console.error("order UI error:", error);
  }
})();
