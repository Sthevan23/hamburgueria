-- Atualiza o WhatsApp de teste sem apagar pedidos.
UPDATE restaurants
SET whatsapp = '5535987216486',
    phone = '(35) 98721-6486',
    banner_url = 'assets/products/burger-banner.jpg'
WHERE slug = 'burger-falcone';
