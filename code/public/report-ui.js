(async () => {
  const branchFilter = document.querySelector("#branch-filter");
  const reportHeaderBranch = document.querySelector("#report-header-branch");
  const errorElement = document.querySelector("#report-error");
  const money = (value) => `฿${Number(value || 0).toFixed(2)}`;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character]));

  async function request(url) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}_=${Date.now()}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
    return data;
  }

  async function loadBranches() {
    const branches = await request("/api/branches");
    const options = '<option value="">ทุกสาขา</option>' + branches.map((branch) =>
      `<option value="${escapeHtml(branch.branch_id)}">${escapeHtml(branch.name)}</option>`,
    ).join("");
    branchFilter.innerHTML = options;
    updateHeaderBranch(branches);
  }

  function updateHeaderBranch(branches = []) {
    if (!reportHeaderBranch) return;
    const selectedBranch = branches.find((branch) => branch.branch_id === branchFilter.value);
    reportHeaderBranch.textContent = selectedBranch?.name || "ทุกสาขา";
  }

  async function loadReport() {
    errorElement.classList.add("hidden");
    document.querySelector("#order-count").textContent = "0";
    document.querySelector("#item-quantity").textContent = "0";
    document.querySelector("#total-sales").textContent = money(0);
    document.querySelector("#sales-items").innerHTML = "";
    const params = new URLSearchParams();
    if (branchFilter.value) params.set("branchId", branchFilter.value);
    for (const id of ["start-date", "end-date"]) {
      const value = document.querySelector(`#${id}`).value;
      if (value) params.set(id === "start-date" ? "startDate" : "endDate", value);
    }
    try {
      const report = await request(`/api/reports/sales?${params}`);
      const branchOptions = [...branchFilter.options].map((option) => ({
        branch_id: option.value,
        name: option.textContent,
      }));
      updateHeaderBranch(branchOptions);
      document.querySelector("#order-count").textContent = report.summary.order_count;
      document.querySelector("#item-quantity").textContent = report.summary.item_quantity;
      document.querySelector("#total-sales").textContent = money(report.summary.total_sales);
      document.querySelector("#sales-items").innerHTML = report.items.length
        ? report.items.map((item) => `<tr>
            <td class="px-5 py-3 font-medium">${escapeHtml(item.menu_name)}<div class="text-xs text-stone-400">${escapeHtml(item.menu_id)}</div></td>
            <td class="px-4 py-3">${escapeHtml(item.branch_id)}</td>
            <td class="px-4 py-3 text-right">${item.quantity_sold}</td>
            <td class="px-5 py-3 text-right font-medium">${money(item.sales_amount)}</td>
          </tr>`).join("")
        : '<tr><td colspan="4" class="px-5 py-8 text-center text-sm text-stone-500">ไม่พบข้อมูลยอดขาย</td></tr>';
    } catch (error) {
      errorElement.textContent = error.message;
      errorElement.classList.remove("hidden");
    }
  }

  document.querySelector("#load-report").addEventListener("click", loadReport);
  try {
    await loadBranches();
    await loadReport();
  } catch (error) {
    errorElement.textContent = error.message;
    errorElement.classList.remove("hidden");
  }
})();

;(async () => {
  try {
    const res = await fetch('/api/menu/B001', { cache: 'no-store' });
    const menus = await res.json();
    document.querySelectorAll('[data-menu-total-count]').forEach((el) => { el.textContent = Array.isArray(menus) ? menus.length : 0; });
  } catch (err) { console.error(err); }
})();
