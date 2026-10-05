CREATE DATABASE IF NOT EXISTS buumonkey_cafe;
USE buumonkey_cafe;

CREATE TABLE cashier (
    cashier_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE menu_item (
    menu_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    cashier_id VARCHAR(50) NOT NULL,
    order_date DATETIME NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    CONSTRAINT fk_orders_cashier
        FOREIGN KEY (cashier_id)
        REFERENCES cashier(cashier_id)
);

CREATE TABLE order_item (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),
    CONSTRAINT fk_order_item_menu
        FOREIGN KEY (menu_id)
        REFERENCES menu_item(menu_id)
);
