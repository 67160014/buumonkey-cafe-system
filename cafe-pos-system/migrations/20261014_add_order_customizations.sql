ALTER TABLE order_item
    ADD COLUMN customizations JSON NULL AFTER unit_price;
