CREATE DATABASE IF NOT EXISTS buumonkey_cafe;
USE buumonkey_cafe;

CREATE TABLE branch (
    branch_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255)
);

CREATE TABLE cashier (
    cashier_id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,

    CONSTRAINT fk_cashier_branch
        FOREIGN KEY (branch_id)
        REFERENCES branch(branch_id)
);

CREATE TABLE menu_item (
    menu_id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_menu_item_branch
        FOREIGN KEY (branch_id)
        REFERENCES branch(branch_id),

    CONSTRAINT chk_menu_item_price
        CHECK (price >= 0),

    CONSTRAINT chk_menu_item_stock
        CHECK (stock_quantity >= 0)
);

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL,
    cashier_id VARCHAR(50) NOT NULL,
    order_date DATETIME NOT NULL,
    payment_method VARCHAR(30) NOT NULL,

    CONSTRAINT fk_orders_branch
        FOREIGN KEY (branch_id)
        REFERENCES branch(branch_id),

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
        REFERENCES menu_item(menu_id),

    CONSTRAINT chk_order_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_item_unit_price
        CHECK (unit_price >= 0)
);
