class OrderItem {
  constructor(item, quantity) {
    this.name = item.name;
    this.unitPrice = item.price; // snapshot ราคา ณ ตอนสั่ง ไม่อ้างอิงราคาปัจจุบันของเมนู
    this.quantity = quantity;
  }

  getSubtotal() {
    return this.unitPrice * this.quantity;
  }
}

class Order {
  constructor(paymentMethod) {
    this.paymentMethod = paymentMethod;
    this.items = [];
    this.createdAt = new Date();
  }

  addItem(item, quantity) {
    this.items.push(new OrderItem(item, quantity));
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.getSubtotal(), 0);
  }

  submit() {
    return this.items.length > 0;
  }
}

module.exports = { Order, OrderItem };
