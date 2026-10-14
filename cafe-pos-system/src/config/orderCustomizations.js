const cupSizes = [
  { id: "S", label: "S (12 oz)", extraPrice: 0 },
  { id: "M", label: "M (16 oz)", extraPrice: 10 },
  { id: "L", label: "L (22 oz)", extraPrice: 15 },
];

const sweetnessLevels = [
  { value: 0, label: "ไม่หวาน", percent: "0%" },
  { value: 30, label: "หวานน้อย", percent: "30%" },
  { value: 70, label: "หวานปานกลาง", percent: "70%" },
  { value: 100, label: "หวานปกติ", percent: "100%" },
  { value: 130, label: "หวานมาก", percent: "130%" },
];

const toppings = [
  { id: "espresso-shot", name: "ช็อตเอสเพรสโซ่เพิ่ม", price: 15 },
  { id: "whipped-cream", name: "วิปครีม", price: 10 },
  { id: "caramel-sauce", name: "คาราเมลซอส", price: 10 },
  { id: "chocolate-fudge", name: "ช็อกโกแลตฟัดจ์", price: 10 },
  { id: "brown-sugar-jelly", name: "บุกบราวน์ชูการ์", price: 10 },
  { id: "cheese-foam", name: "วิปชีส / ฟองนม", price: 15 },
];

module.exports = { cupSizes, sweetnessLevels, toppings };
