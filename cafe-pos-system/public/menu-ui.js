(async () => {
  const branchStorageKey = "cafe-pos-branch-id";
  const cashierStorageKey = "cafe-pos-cashier-id";
  let branchId = "";
  const branchSelect = document.querySelector("#menu-branch-select");
  const cashierSelect = document.querySelector("#menu-cashier-select");
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));
  const money = (value) => Number(value).toFixed(2);
  const initialTable = document.querySelector('[data-purpose="menu-catalog-table"] tbody');
  if (initialTable) initialTable.replaceChildren();
  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
    return data;
  }
  async function loadMenu() {
    const items = await request(`/api/menu/${encodeURIComponent(branchId)}`);
    document.querySelectorAll("[data-menu-total-count]").forEach((element) => {
      element.textContent = items.length;
    });
    const listCount = document.querySelector("[data-menu-list-count]");
    if (listCount) listCount.textContent = `(${items.length} จาก ${items.length} รายการ)`;
    const pagination = document.querySelector("[data-menu-pagination]");
    if (pagination) {
      pagination.textContent = items.length
        ? `แสดง 1 - ${items.length} จาก ${items.length} รายการ`
        : "แสดง 0 - 0 จาก 0 รายการ";
    }
    const table = document.querySelector('[data-purpose="menu-catalog-table"] tbody');
    if (!table) return;
    table.innerHTML = items.map((item) => `
      <tr class="hover:bg-stone-50/50 transition">
        <td class="py-3.5 px-5"><div class="font-medium text-stone-900 text-sm">${escapeHtml(item.name)}</div>
          <div class="text-stone-400 text-[11px]">${escapeHtml(item.menu_id)}</div></td>
        <td class="py-3.5 px-4 text-right font-semibold">฿${money(item.price)}</td>
        <td class="py-3.5 px-4 text-center font-medium">${item.stock_quantity} แก้ว</td>
        <td class="py-3.5 px-4 text-center">${item.stock_quantity < 10 ? "⚠️ สต็อกเหลือน้อย" : "ปกติ"}</td>
        <td class="py-3.5 px-5 text-right"><button class="text-rose-600" data-delete="${escapeHtml(item.menu_id)}">ลบ</button></td>
      </tr>`).join("");
    table.style.visibility = "visible";
    table.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!confirm(`ลบเมนู ${button.dataset.delete} หรือไม่`)) return;
        await request(`/api/menu/item/${encodeURIComponent(button.dataset.delete)}?branchId=${encodeURIComponent(branchId)}`, { method: "DELETE" });
        await loadMenu();
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
    const cashierId = cashiers.some((cashier) => cashier.cashier_id === savedCashierId)
      ? savedCashierId
      : cashiers[0]?.cashier_id || "";
    cashierSelect.value = cashierId;
    cashierSelect.disabled = cashiers.length === 0;
    if (cashierId) localStorage.setItem(cashierStorageKey, cashierId);
  }
  branchSelect.addEventListener("change", async () => {
    const previousBranchId = branchId;
    branchId = branchSelect.value;
    localStorage.setItem(branchStorageKey, branchId);
    branchSelect.disabled = true;
    cashierSelect.disabled = true;
    try {
      await loadCashiers();
      await loadMenu();
    } catch (error) {
      branchId = previousBranchId;
      branchSelect.value = previousBranchId;
      localStorage.setItem(branchStorageKey, previousBranchId);
      console.error("menu branch change error:", error);
      try {
        await loadCashiers();
        await loadMenu();
      } catch (reloadError) {
        console.error("menu restore error:", reloadError);
      }
    } finally {
      branchSelect.disabled = false;
      cashierSelect.disabled = cashierSelect.options.length === 0;
    }
  });
  cashierSelect.addEventListener("change", () => {
    if (cashierSelect.value) localStorage.setItem(cashierStorageKey, cashierSelect.value);
  });
  document.querySelectorAll("a").forEach((link) => {
    const label = link.textContent.trim();
    if (label.includes("สั่งออเดอร์")) link.href = "/";
    if (label.includes("รายงานยอดขาย")) link.href = "/report.html";
    if (label.includes("ประวัติใบเสร็จ")) link.href = "/receipt.html";
  });
  try {
    await loadBranches();
    await loadCashiers();
    await loadMenu();
    document.querySelector("#menu-main-content").style.visibility = "visible";
  } catch (error) { console.error("menu UI error:", error); }
})();
