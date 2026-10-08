(async () => {
  const form = document.querySelector("#receipt-form");
  const receipt = document.querySelector("#receipt");
  const message = document.querySelector("#receipt-message");
  const recentOrders = document.querySelector("#recent-orders");
  const recentOrdersMessage = document.querySelector("#recent-orders-message");
  const branchFilter = document.querySelector("#receipt-branch-filter");
  let branchNamesPromise;
  const money = (value) => `฿${Number(value || 0).toFixed(2)}`;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
  async function loadBranchNames() {
    if (!branchNamesPromise) {
      branchNamesPromise = fetch("/api/branches", { cache: "no-store" })
        .then(async (response) => {
          const branches = await response.json();
          if (!response.ok) throw new Error(branches.error || "ไม่สามารถโหลดข้อมูลสาขาได้");
          return new Map(branches.map((branch) => [branch.branch_id, branch.name]));
        });
    }
    return branchNamesPromise;
  }

  async function loadBranches() {
    const branchNames = await loadBranchNames();
    branchFilter.replaceChildren(new Option("ทุกสาขา", ""));
    for (const [branchId, branchName] of branchNames) {
      branchFilter.add(new Option(branchName, branchId));
    }
  }

  async function loadReceipt(orderId) {
    receipt.classList.add("hidden");
    message.classList.add("hidden");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/receipt`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ไม่พบใบเสร็จ");
      const branchNames = await loadBranchNames();
      form.elements["order-id"].value = data.orderId;
      document.querySelector("#receipt-id").textContent = data.orderId;
      const branchName = data.branchName || branchNames.get(data.branchId) || data.branchId;
      const cashierName = data.cashierName || data.cashierId;
      document.querySelector("#receipt-branch").textContent = branchName;
      document.querySelector("#receipt-cashier").textContent = cashierName;
      document.querySelector("#receipt-date").textContent = new Date(data.orderDate).toLocaleString("th-TH");
      document.querySelector("#receipt-payment").textContent = data.paymentMethod === "qr" ? "QR Code" : "เงินสด";
      document.querySelector("#receipt-total").textContent = money(data.totalAmount);
      document.querySelector("#receipt-subtotal").textContent = money(data.totalAmount);
      document.querySelector("#receipt-items").innerHTML = data.items.map((item) => `
        <div class="mb-3 flex justify-between gap-3">
          <div><p class="font-medium text-stone-900">${escapeHtml(item.menuName)} <span class="text-stone-400">x${item.quantity}</span></p>
          <p class="text-[10px] text-stone-500">${money(item.unitPrice)} / หน่วย</p></div>
          <span class="shrink-0 font-medium text-stone-900">${money(item.subtotal)}</span>
        </div>`).join("");
      receipt.classList.remove("hidden");
      receipt.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      message.textContent = error.message;
      message.classList.remove("hidden");
    }
  }

  async function loadRecentOrders() {
    recentOrdersMessage.classList.add("hidden");
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const orders = await response.json();
      if (!response.ok) throw new Error(orders.error || "ไม่สามารถโหลดรายการออเดอร์ได้");
      const branchNames = await loadBranchNames();
      const filteredOrders = branchFilter.value
        ? orders.filter((order) => order.branch_id === branchFilter.value)
        : orders;
      const latestOrders = filteredOrders.slice(0, 10);
      if (latestOrders.length === 0) {
        recentOrders.innerHTML = `<p class="text-sm text-stone-500">${branchFilter.value ? "ไม่พบออเดอร์ในสาขานี้" : "ยังไม่มีออเดอร์"}</p>`;
        return;
      }
      recentOrders.innerHTML = latestOrders.map((order) => `
        <button type="button" data-order-id="${escapeHtml(order.order_id)}"
          class="rounded-xl border border-stone-200 p-3 text-left transition hover:border-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-700">
          <span class="block font-semibold text-stone-900">ออเดอร์ #${escapeHtml(order.order_id)}</span>
          <span class="mt-1 block text-xs text-stone-500">${escapeHtml(new Date(order.order_date).toLocaleString("th-TH"))}</span>
          <span class="mt-1 block text-xs text-stone-600">${escapeHtml(branchNames.get(order.branch_id) || order.branch_id)} · ${order.payment_method === "qr" ? "QR Code" : "เงินสด"}</span>
          <span class="mt-1 block text-sm font-semibold text-stone-900">${money(order.total_amount)}</span>
        </button>`).join("");
    } catch (error) {
      recentOrdersMessage.textContent = error.message;
      recentOrdersMessage.classList.remove("hidden");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadReceipt(form.elements["order-id"].value);
  });
  recentOrders.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-order-id]");
    if (button) await loadReceipt(button.dataset.orderId);
  });
  branchFilter.addEventListener("change", loadRecentOrders);
  document.querySelector("#print-receipt").addEventListener("click", (event) => {
    event.preventDefault();
    window.print();
  });
  try {
    await loadBranches();
    await loadRecentOrders();
  } catch (error) {
    recentOrdersMessage.textContent = error.message;
    recentOrdersMessage.classList.remove("hidden");
  }
})();

;(async () => {
  try {
    const res = await fetch('/api/menu/B001', { cache: 'no-store' });
    const menus = await res.json();
    document.querySelectorAll('[data-menu-total-count]').forEach((el) => { el.textContent = Array.isArray(menus) ? menus.length : 0; });
  } catch (err) { console.error(err); }
})();
