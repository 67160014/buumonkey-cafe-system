(async () => {
  const branchStorageKey = "cafe-pos-branch-id";
  const cashierStorageKey = "cafe-pos-cashier-id";
  let branchId = "";
  let cashierId = "";
  let customizationOptions;
  let customizationMenu;
  let editingCartKey = null;
  let customizationQuantity = 1;
  const branchSelect = document.querySelector("#branch-select");
  const cashierSelect = document.querySelector("#cashier-select");
  const orderStatus = document.querySelector("#order-status");
  const confirmOrderButton = document.querySelector("#confirm-order-button");
  const customizationDialog = document.querySelector("#customization-dialog");
  const customizationForm = document.querySelector("#customization-form");
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

  function lineKey(menuId, cupSizeId, sweetnessValue, toppingIds) {
    return JSON.stringify([menuId, cupSizeId, sweetnessValue, [...toppingIds].sort()]);
  }

  function lineDetails(item) {
    const toppingText = item.toppings.map((topping) => topping.name).join(", ");
    return `${item.cupSize.label} · ${item.sweetness.percent}${toppingText ? ` · ${toppingText}` : ""}`;
  }

  function renderCart() {
    const list = document.querySelector("#cart-items");
    if (!list) return;
    if (!list.dataset.bound) {
      list.dataset.bound = "true";
      list.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const key = button.dataset.key;
        if (button.dataset.action === "edit") {
          const item = cart.get(key);
          if (item) {
            openCustomization({
              menu_id: item.menu_id,
              name: item.name,
              price: item.basePrice,
              stock_quantity: item.stock_quantity,
            }, key);
          }
          return;
        }
        if (button.dataset.action === "remove") {
          cart.delete(key);
          renderCart();
          return;
        }
        updateCartQuantity(key, button.dataset.action === "increase" ? 1 : -1);
      });
    }
    list.replaceChildren();
    let total = 0;
    let count = 0;
    for (const item of cart.values()) {
      const subtotal = item.unitPrice * item.qty;
      total += subtotal;
      count += item.qty;
      const row = document.createElement("div");
      row.className = "grid grid-cols-12 items-center py-2.5 px-3 rounded-xl bg-stone-50/70 text-sm";
      row.innerHTML = `
        <div class="col-span-5 min-w-0 font-semibold text-stone-800">
          <span class="block">${escapeHtml(item.name)}</span>
          <span class="mt-0.5 block truncate text-[10px] font-normal text-stone-500">${escapeHtml(lineDetails(item))}</span>
          <span class="block text-[10px] font-normal text-stone-500">${money(item.unitPrice)} ฿ / แก้ว</span>
        </div>
        <div class="col-span-3 flex items-center justify-center space-x-1.5">
          <button class="w-6 h-6 rounded-lg bg-white shadow-xs" data-action="decrease" data-key="${escapeHtml(item.key)}" aria-label="ลดจำนวน">−</button>
          <span class="font-bold w-4 text-center">${item.qty}</span>
          <button class="w-6 h-6 rounded-lg bg-white shadow-xs" data-action="increase" data-key="${escapeHtml(item.key)}" aria-label="เพิ่มจำนวน">+</button>
        </div>
        <div class="col-span-2 text-right font-bold">${money(subtotal)} ฿</div>
        <div class="col-span-2 text-right">
          <button class="text-xs text-amber-800 hover:underline" data-action="edit" data-key="${escapeHtml(item.key)}">ปรับ</button>
          <button class="ml-1 text-xs text-rose-600 hover:underline" data-action="remove" data-key="${escapeHtml(item.key)}">ลบ</button>
        </div>`;
      list.appendChild(row);
    }
    document.querySelector("#cart-item-count").textContent = `${count} แก้ว`;
    document.querySelector("#cart-total").textContent = money(total);
    document.querySelector("#confirm-btn-label").textContent = "ยืนยันออเดอร์";
  }

  function renderCustomizationOptions() {
    document.querySelector("#cup-size-options").innerHTML = customizationOptions.cupSizes.map((size) => `
      <label class="cursor-pointer rounded-xl border border-stone-200 p-3 text-center has-[:checked]:border-amber-700 has-[:checked]:bg-amber-50">
        <input class="sr-only" type="radio" name="cup-size" value="${escapeHtml(size.id)}">
        <span class="block text-sm font-semibold">${escapeHtml(size.label)}</span>
        <span class="mt-1 block text-xs text-stone-500">${size.extraPrice ? `+${money(size.extraPrice)} ฿` : "ราคาเดิม"}</span>
      </label>`).join("");
    document.querySelector("#sweetness-options").innerHTML = customizationOptions.sweetnessLevels.map((level) => `
      <label class="cursor-pointer rounded-xl border border-stone-200 p-2 text-center has-[:checked]:border-amber-700 has-[:checked]:bg-amber-50">
        <input class="sr-only" type="radio" name="sweetness" value="${level.value}">
        <span class="block text-xs font-semibold">${escapeHtml(level.percent)}</span>
        <span class="mt-1 block text-[10px] text-stone-500">${escapeHtml(level.label)}</span>
      </label>`).join("");
    document.querySelector("#topping-options").innerHTML = customizationOptions.toppings.map((topping) => `
      <label class="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-stone-200 p-3 has-[:checked]:border-amber-700 has-[:checked]:bg-amber-50">
        <span class="flex items-center gap-2 text-xs font-medium">
          <input type="checkbox" name="topping" value="${escapeHtml(topping.id)}" class="rounded border-stone-300 text-amber-800 focus:ring-amber-700">
          ${escapeHtml(topping.name)}
        </span>
        <span class="shrink-0 text-xs text-stone-500">+${money(topping.price)} ฿</span>
      </label>`).join("");
  }

  function getReservedQuantity(menuId, excludeKey = null) {
    return [...cart.values()]
      .filter((item) => item.menu_id === menuId && item.key !== excludeKey)
      .reduce((sum, item) => sum + item.qty, 0);
  }

  function selectedCustomization() {
    const cupSizeId = customizationForm.querySelector("[name='cup-size']:checked")?.value;
    const sweetnessValue = Number(customizationForm.querySelector("[name='sweetness']:checked")?.value);
    const toppingIds = [...customizationForm.querySelectorAll("[name='topping']:checked")]
      .map((input) => input.value);
    const cupSize = customizationOptions.cupSizes.find((option) => option.id === cupSizeId);
    const sweetness = customizationOptions.sweetnessLevels.find((option) => option.value === sweetnessValue);
    const toppings = toppingIds.map((id) => customizationOptions.toppings.find((option) => option.id === id));
    return { cupSize, sweetness, toppings, toppingIds };
  }

  function updateCustomizationSummary() {
    if (!customizationMenu) return;
    const selected = selectedCustomization();
    if (!selected.cupSize || !selected.sweetness || selected.toppings.some((topping) => !topping)) return;
    const unitPrice = Number(customizationMenu.price)
      + selected.cupSize.extraPrice
      + selected.toppings.reduce((sum, topping) => sum + topping.price, 0);
    const targetKey = lineKey(
      customizationMenu.menu_id,
      selected.cupSize.id,
      selected.sweetness.value,
      selected.toppingIds,
    );
    const existingTargetQuantity = targetKey === editingCartKey ? 0 : (cart.get(targetKey)?.qty || 0);
    const reservedElsewhere = [...cart.values()]
      .filter((item) => item.menu_id === customizationMenu.menu_id
        && item.key !== editingCartKey && item.key !== targetKey)
      .reduce((sum, item) => sum + item.qty, 0);
    const availableQuantity = customizationMenu.stock_quantity - reservedElsewhere - existingTargetQuantity;
    document.querySelector("#customization-quantity").textContent = customizationQuantity;
    document.querySelector("#customization-total").textContent = `${money(unitPrice * customizationQuantity)} ฿`;
    document.querySelector("#customization-available-stock").textContent =
      `เลือกได้สูงสุด ${availableQuantity} แก้ว`;
  }

  function openCustomization(menu, existingKey = null) {
    customizationMenu = menu;
    editingCartKey = existingKey;
    const existing = existingKey ? cart.get(existingKey) : null;
    customizationQuantity = existing?.qty || 1;
    document.querySelector("#customization-title").textContent = menu.name;
    document.querySelector("#customization-menu-name").textContent = existing
      ? `แก้ไขรายการ · ราคาเริ่มต้น ${money(menu.price)} ฿`
      : `ราคาเริ่มต้น ${money(menu.price)} ฿`;
    customizationForm.querySelectorAll("[name='cup-size']").forEach((input) => {
      input.checked = input.value === (existing?.cupSize.id || "M");
    });
    customizationForm.querySelectorAll("[name='sweetness']").forEach((input) => {
      input.checked = Number(input.value) === (existing?.sweetness.value ?? 25);
    });
    const selectedToppingIds = new Set(existing?.toppings.map((topping) => topping.id) || []);
    customizationForm.querySelectorAll("[name='topping']").forEach((input) => {
      input.checked = selectedToppingIds.has(input.value);
    });
    document.querySelector("#save-customization").textContent = existing ? "บันทึกการแก้ไข" : "เพิ่ม";
    updateCustomizationSummary();
    customizationDialog.showModal();
  }

  function updateCartQuantity(key, delta) {
    const item = cart.get(key);
    if (!item) return;
    if (delta > 0 && getReservedQuantity(item.menu_id) >= item.stock_quantity) {
      showOrderStatus("สต็อกไม่เพียงพอสำหรับเพิ่มจำนวน", true);
      return;
    }
    item.qty += delta;
    if (item.qty <= 0) cart.delete(key);
    renderCart();
  }

  async function loadMenu() {
    const items = await request(`/api/menu/${encodeURIComponent(branchId)}`);
    const menuById = new Map(items.map((item) => [item.menu_id, item]));
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
        const item = menuById.get(button.dataset.add);
        if (item) openCustomization(item);
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

  customizationForm.addEventListener("change", updateCustomizationSummary);
  document.querySelector("#customization-qty-decrease").addEventListener("click", () => {
    customizationQuantity = Math.max(1, customizationQuantity - 1);
    updateCustomizationSummary();
  });
  document.querySelector("#customization-qty-increase").addEventListener("click", () => {
    const selected = selectedCustomization();
    const targetKey = lineKey(
      customizationMenu.menu_id,
      selected.cupSize.id,
      selected.sweetness.value,
      selected.toppingIds,
    );
    const existingTargetQuantity = targetKey === editingCartKey ? 0 : (cart.get(targetKey)?.qty || 0);
    const reservedElsewhere = [...cart.values()]
      .filter((item) => item.menu_id === customizationMenu.menu_id
        && item.key !== editingCartKey && item.key !== targetKey)
      .reduce((sum, item) => sum + item.qty, 0);
    const available = customizationMenu.stock_quantity - reservedElsewhere - existingTargetQuantity;
    if (customizationQuantity >= available) {
      showOrderStatus("สต็อกไม่เพียงพอสำหรับเพิ่มจำนวน", true);
      return;
    }
    customizationQuantity += 1;
    updateCustomizationSummary();
  });
  document.querySelector("#cancel-customization").addEventListener("click", () => customizationDialog.close());
  document.querySelector("#close-customization").addEventListener("click", () => customizationDialog.close());
  customizationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = selectedCustomization();
    if (!selected.cupSize || !selected.sweetness || selected.toppings.some((topping) => !topping)) {
      showOrderStatus("กรุณาเลือกขนาดแก้วและระดับความหวาน", true);
      return;
    }
    const key = lineKey(customizationMenu.menu_id, selected.cupSize.id, selected.sweetness.value, selected.toppingIds);
    const existingTarget = cart.get(key);
    const reservedElsewhere = [...cart.values()]
      .filter((item) => item.menu_id === customizationMenu.menu_id
        && item.key !== editingCartKey && item.key !== key)
      .reduce((sum, item) => sum + item.qty, 0);
    const targetQuantity = (existingTarget && key !== editingCartKey ? existingTarget.qty : 0)
      + customizationQuantity;
    if (reservedElsewhere + targetQuantity > customizationMenu.stock_quantity) {
      showOrderStatus("สต็อกไม่เพียงพอสำหรับจำนวนที่เลือก", true);
      return;
    }
    if (editingCartKey) cart.delete(editingCartKey);
    const unitPrice = Number(customizationMenu.price)
      + selected.cupSize.extraPrice
      + selected.toppings.reduce((sum, topping) => sum + topping.price, 0);
    cart.set(key, {
      key,
      menu_id: customizationMenu.menu_id,
      name: customizationMenu.name,
      stock_quantity: customizationMenu.stock_quantity,
      qty: targetQuantity,
      basePrice: Number(customizationMenu.price),
      unitPrice,
      cupSize: selected.cupSize,
      sweetness: selected.sweetness,
      toppings: selected.toppings,
    });
    showOrderStatus("");
    customizationDialog.close();
    renderCart();
  });

  window.updateQty = updateCartQuantity;
  window.removeItem = (key) => { cart.delete(key); renderCart(); };
  window.clearCart = () => {
    cart.clear();
    showOrderStatus("");
    renderCart();
  };
  window.confirmOrder = async () => {
    const items = [...cart.values()].map((item) => ({
      menuId: item.menu_id,
      quantity: item.qty,
      cupSize: item.cupSize.id,
      sweetnessLevel: item.sweetness.value,
      toppingIds: item.toppings.map((topping) => topping.id),
    }));
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
    const options = await request("/api/orders/customizations");
    if (!Array.isArray(options.cupSizes) || !Array.isArray(options.sweetnessLevels) || !Array.isArray(options.toppings)) {
      throw new Error("ข้อมูลตัวเลือกปรับแต่งไม่ถูกต้อง");
    }
    customizationOptions = options;
    renderCustomizationOptions();
    await loadBranches();
    await loadCashiers();
    await loadMenu();
    renderCart();
    document.querySelector("#pos-main-content").style.visibility = "visible";
  } catch (error) {
    console.error("order UI error:", error);
    showOrderStatus(error.message, true);
  }
})();
