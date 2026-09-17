/* ==========================================================================
   มหาชัยตรัยอนันต์ — script.js
   ใช้ร่วมกับ product.html: จัดการโหลดสินค้า, ปุ่มกรองตามรส, และการ render การ์ด
   ต้องมี element: #filter-bar, #product-list ในหน้า HTML
   ========================================================================== */

const TASTE_LABELS = {
  "ช็อคโกแลต": "ช็อคโกแลต",
  "ช็อคโกแลตชิพ": "ช็อคโกแลตชิพ",
  "คุกกี้แอนด์ครีม": "คุกกี้แอนด์ครีม",
  "มิ้นช็อค": "มิ้นช็อค",
  "ทุเรียน": "ทุเรียน"
};

const TASTE_CLASS = {
  "ช็อคโกแลต": "taste-choco",
  "ช็อคโกแลตชิพ": "taste-chip",
  "คุกกี้แอนด์ครีม": "taste-cookie",
  "มิ้นช็อค": "taste-mint",
  "ทุเรียน": "taste-durian"
};

let allProducts = [];
let activeTaste = "all";

function renderFilterBar() {
  const bar = document.getElementById("filter-bar");
  const tastes = ["all", ...Object.keys(TASTE_LABELS)];

  bar.innerHTML = tastes.map(function (taste) {
    const label = taste === "all" ? "ทั้งหมด" : TASTE_LABELS[taste];
    const activeClass = taste === activeTaste ? " is-active" : "";
    return '<button type="button" class="filter-btn' + activeClass + '" data-taste="' + taste + '">' + label + '</button>';
  }).join("");

  bar.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeTaste = btn.getAttribute("data-taste");
      renderFilterBar();
      renderProductList();
    });
  });
}

function renderProductList() {
  const list = document.getElementById("product-list");
  const filtered = activeTaste === "all"
    ? allProducts
    : allProducts.filter(function (p) { return p.taste === activeTaste; });

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">ไม่พบสินค้าในรสนี้</p>';
    return;
  }

  list.innerHTML = filtered.map(renderProductCard).join("");
}

function renderProductCard(product) {
  const tasteClass = TASTE_CLASS[product.taste] || "";

  const sizeRows = product.sizes.map(function (s) {
    const orderLink = "order.html?item=" +
      encodeURIComponent(product.name + " ถ้วย" + s.size) +
      "&price=" + encodeURIComponent(s.price);

    return '' +
      '<div class="product-card__size-row">' +
      '<span>ถ้วย' + s.size + ' (' + s.unit + ')</span>' +
      '<span>' + s.price + ' บาท</span>' +
      '</div>' +
      '<a class="btn btn-primary product-card__order-btn" href="' + orderLink + '">สั่งซื้อ ถ้วย' + s.size + '</a>';
  }).join("");

  return '' +
    '<article class="product-card ' + tasteClass + '">' +
    '<div class="product-card__image"><img src="' + product.image + '" alt="' + product.name + '" loading="lazy"></div>' +
    '<h3><span class="product-card__taste-mark"></span>' + product.name + '</h3>' +
    '<p>' + product.description + '</p>' +
    '<div class="product-card__size-list">' + sizeRows + '</div>' +
    '</article>';
}

function applyTasteFromURL() {
  const params = new URLSearchParams(window.location.search);
  const taste = params.get("taste");
  if (taste && TASTE_LABELS[taste]) {
    activeTaste = taste;
  }
}

function initProductPage() {
  fetch("products.json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      allProducts = data;
      applyTasteFromURL();
      renderFilterBar();
      renderProductList();
    })
    .catch(function (error) {
      console.error(error);
      document.getElementById("product-list").innerHTML =
        '<p class="empty-state">ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง</p>';
    });
}

/* ==========================================================================
   order.html: อ่าน item/price จาก URL, เติมฟอร์ม, ส่งออเดอร์ไป Apps Script
   ต้องมี element: #orderForm, #customerName, #contact, #items, #total, #note
   ========================================================================== */

/* TODO: แทนที่ด้วย URL ของ Apps Script Web App ที่ deploy แล้ว */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx6Nr6XfiNWCtr8t6jSJHGW_te9kEc0jgPNUaiMI2M4hVB-U-vVilo3WWyZ_7aAkh1p/exec";

function fillOrderFromURL() {
  const params = new URLSearchParams(window.location.search);
  const item = params.get("item");
  const price = params.get("price");

  if (item) {
    document.getElementById("items").value = item;
  }
  if (price) {
    document.getElementById("total").value = price;
  }
}

function handleOrderSubmit(e) {
  e.preventDefault();

  const payload = {
    customerName: document.getElementById("customerName").value,
    contact: document.getElementById("contact").value,
    items: document.getElementById("items").value,
    total: document.getElementById("total").value,
    note: document.getElementById("note").value
  };

  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  .then(() => { window.location.href = 'thankyou.html'; })
  .catch(error => {
    console.error(error);
    alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
  });
}

function initOrderPage() {
  fillOrderFromURL();
  document.getElementById("orderForm").addEventListener("submit", handleOrderSubmit);
}

/* ==========================================================================
   admin.html: โหลด CSV, parse เอง, แสดงในตาราง เรียงล่าสุดขึ้นก่อน
   ต้องมี element: #ordersTable tbody
   ========================================================================== */

/* TODO: แทนที่ด้วย URL สำหรับ export ชีตเป็น CSV เช่น
   https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv&sheet=Sheet1 */
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQsOXC2gkt4UqxWdhBxbt5kn8h9GsNqjBQPRGBLDdmUnQL8GGQYH14-_iFyc0ww_71th25_XqTdIhP9/pub?gid=0&single=true&output=csv";

// แปลงข้อความ CSV เป็น array of rows (array of fields)
// รองรับฟิลด์ที่ครอบด้วย " และมีจุลภาคหรือขึ้นบรรทัดใหม่อยู่ข้างใน
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = "";
      } else if (char === '\r') {
        // ข้าม \r เฉยๆ รอจัดการที่ \n
      } else if (char === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(function (r) {
    return r.length > 1 || (r.length === 1 && r[0].trim() !== "");
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function renderOrderRows(rows) {
  const tbody = document.querySelector("#ordersTable tbody");

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-row">ยังไม่มีรายการสั่งซื้อ</td></tr>';
    return;
  }

  // สมมติแถวแรกของข้อมูลคือแถวเก่าสุด (เขียนต่อท้ายเรื่อยๆ) จึงกลับลำดับให้ล่าสุดขึ้นก่อน
  const latestFirst = rows.slice().reverse();

  tbody.innerHTML = latestFirst.map(function (cols) {
    const [datetime, name, contact, items, total, note] = cols;
    return '' +
      '<tr>' +
      '<td>' + escapeHTML(datetime) + '</td>' +
      '<td>' + escapeHTML(name) + '</td>' +
      '<td>' + escapeHTML(contact) + '</td>' +
      '<td>' + escapeHTML(items) + '</td>' +
      '<td>' + escapeHTML(total) + '</td>' +
      '<td>' + escapeHTML(note) + '</td>' +
      '</tr>';
  }).join("");
}

function initAdminPage() {
  fetch(CSV_URL)
    .then(function (res) { return res.text(); })
    .then(function (csvText) {
      const allRows = parseCSV(csvText);
      const dataRows = allRows.length > 0 && /วันเวลา|timestamp|date/i.test(allRows[0][0])
        ? allRows.slice(1)
        : allRows;
      renderOrderRows(dataRows);
    })
    .catch(function (error) {
      console.error(error);
      document.querySelector("#ordersTable tbody").innerHTML =
        '<tr><td colspan="6" class="error-row">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</td></tr>';
    });
}

/* ==========================================================================
   Router เล็กๆ: เช็คว่าหน้าไหนมี element อะไร แล้วเรียกฟังก์ชันที่เกี่ยวข้อง
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("product-list")) {
    initProductPage();
  }
  if (document.getElementById("orderForm")) {
    initOrderPage();
  }
  if (document.querySelector("#ordersTable tbody")) {
    initAdminPage();
  }
});
