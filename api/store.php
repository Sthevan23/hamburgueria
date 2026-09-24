<?php

const STORE_FILE = __DIR__ . '/data/store.json';
const MENU_FILE = dirname(__DIR__) . '/data/menu-seed.json';
const JWT_SECRET = 'burger-falcone-secret-change-in-production';
const ADMIN_HASH = '$2a$10$V01hM1DKxxRa.v5c0A8evO8ErKucSqDZyZuEwOsTYXMCqZkE8ZvGu';

function store_now(): string {
  return gmdate('Y-m-d H:i:s');
}

function store_seed(): array {
  $menu = ['categories' => [], 'products' => [], 'highlights' => []];
  if (is_file(MENU_FILE)) {
    $decoded = json_decode((string) file_get_contents(MENU_FILE), true);
    if (is_array($decoded)) $menu = $decoded;
  }

  $categories = [];
  $catMap = [];
  foreach ($menu['categories'] as $i => $cat) {
    $id = $i + 1;
    $categories[] = [
      'id' => $id,
      'restaurant_id' => 1,
      'slug' => $cat['id'],
      'label' => $cat['label'],
      'sort_order' => $i,
      'active' => 1,
    ];
    $catMap[$cat['id']] = $id;
  }

  $highlights = array_flip($menu['highlights'] ?? []);
  $products = [];
  $counters = [];
  foreach ($menu['products'] as $i => $p) {
    $cid = $catMap[$p['category']] ?? null;
    if (!$cid) continue;
    $counters[$p['category']] = ($counters[$p['category']] ?? 0) + 1;
    $products[] = [
      'id' => $i + 1,
      'restaurant_id' => 1,
      'category_id' => $cid,
      'slug' => $p['id'],
      'name' => $p['name'],
      'description' => $p['description'] ?? '',
      'price' => (float) $p['price'],
      'promo_price' => null,
      'sku' => null,
      'image_url' => $p['image'] ?? '',
      'badge' => $p['badge'] ?? null,
      'prep_time' => 15,
      'is_highlight' => isset($highlights[$p['id']]) ? 1 : 0,
      'sort_order' => $counters[$p['category']],
      'available' => 1,
      'created_at' => store_now(),
    ];
  }

  return [
    'restaurant' => [
      'id' => 1,
      'name' => 'Burger Falcone',
      'slug' => 'burger-falcone',
      'logo_url' => null,
      'banner_url' => 'assets/products/burger-banner.jpg',
      'phone' => '(35) 98721-6486',
      'whatsapp' => '5535987216486',
      'address' => 'Rua Exemplo, 123 — Centro',
      'is_open' => 1,
      'closed_message' => 'Estamos fechados no momento. Volte em breve!',
      'min_order' => 25,
      'delivery_fee' => 5,
      'prep_time' => 30,
      'schedule_json' => '{"days":[0,2,3,4,5,6],"open":"18:00","close":"23:30"}',
    ],
    'users' => [
      [
        'id' => 1,
        'restaurant_id' => 1,
        'name' => 'Administrador',
        'email' => 'admin@burgerfalcone.com',
        'password_hash' => ADMIN_HASH,
        'role' => 'admin',
        'active' => 1,
      ],
      [
        'id' => 2,
        'restaurant_id' => 1,
        'name' => 'Cozinha',
        'email' => 'cozinha@burgerfalcone.com',
        'password_hash' => ADMIN_HASH,
        'role' => 'kitchen',
        'active' => 1,
      ],
    ],
    'categories' => $categories,
    'products' => $products,
    'orders' => [],
    'customers' => [],
    'zones' => [
      ['id' => 1, 'restaurant_id' => 1, 'name' => 'Centro', 'fee' => 5, 'active' => 1],
      ['id' => 2, 'restaurant_id' => 1, 'name' => 'Jardim', 'fee' => 7, 'active' => 1],
      ['id' => 3, 'restaurant_id' => 1, 'name' => 'Vila Nova', 'fee' => 8, 'active' => 1],
      ['id' => 4, 'restaurant_id' => 1, 'name' => 'Bairro Industrial', 'fee' => 10, 'active' => 1],
    ],
    'coupons' => [
      ['id' => 1, 'restaurant_id' => 1, 'code' => 'HAMB10', 'discount_type' => 'percent', 'discount_value' => 10, 'min_order' => 50, 'used_count' => 0, 'usage_limit' => 100, 'active' => 1],
    ],
    'addon_groups' => [
      ['id' => 1, 'restaurant_id' => 1, 'name' => 'Escolha seu queijo', 'min_qty' => 0, 'max_qty' => 1, 'required' => 0, 'sort_order' => 0, 'active' => 1],
      ['id' => 2, 'restaurant_id' => 1, 'name' => 'Adicionais', 'min_qty' => 0, 'max_qty' => 10, 'required' => 0, 'sort_order' => 1, 'active' => 1],
    ],
    'addons' => [
      ['id' => 1, 'group_id' => 1, 'name' => 'Cheddar', 'price' => 3, 'sort_order' => 0, 'active' => 1],
      ['id' => 2, 'group_id' => 1, 'name' => 'Mussarela', 'price' => 2.5, 'sort_order' => 1, 'active' => 1],
      ['id' => 3, 'group_id' => 1, 'name' => 'Gorgonzola', 'price' => 4, 'sort_order' => 2, 'active' => 1],
      ['id' => 4, 'group_id' => 2, 'name' => 'Bacon', 'price' => 5, 'sort_order' => 0, 'active' => 1],
      ['id' => 5, 'group_id' => 2, 'name' => 'Ovo', 'price' => 2, 'sort_order' => 1, 'active' => 1],
      ['id' => 6, 'group_id' => 2, 'name' => 'Cebola caramelizada', 'price' => 3, 'sort_order' => 2, 'active' => 1],
    ],
    'payments' => [
      ['id' => 1, 'restaurant_id' => 1, 'name' => 'Pix', 'slug' => 'pix', 'active' => 1, 'sort_order' => 0],
      ['id' => 2, 'restaurant_id' => 1, 'name' => 'Dinheiro', 'slug' => 'dinheiro', 'active' => 1, 'sort_order' => 1],
      ['id' => 3, 'restaurant_id' => 1, 'name' => 'Cartão de Crédito', 'slug' => 'cartao-credito', 'active' => 1, 'sort_order' => 2],
      ['id' => 4, 'restaurant_id' => 1, 'name' => 'Cartão de Débito', 'slug' => 'cartao-debito', 'active' => 1, 'sort_order' => 3],
      ['id' => 5, 'restaurant_id' => 1, 'name' => 'Vale-refeição', 'slug' => 'vale-refeicao', 'active' => 1, 'sort_order' => 4],
    ],
    'notifications' => [],
    'expenses' => [],
    'stock' => [],
    'next' => [
      'user' => 3,
      'category' => count($categories) + 1,
      'product' => count($products) + 1,
      'order' => 1,
      'order_number' => 101,
      'customer' => 1,
      'zone' => 5,
      'coupon' => 2,
      'notification' => 1,
      'expense' => 1,
      'addon_group' => 3,
      'addon' => 7,
    ],
  ];
}

function store_load(): array {
  $dir = dirname(STORE_FILE);
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  if (!is_file(STORE_FILE)) {
    $seed = store_seed();
    store_save($seed);
    return $seed;
  }
  $raw = (string) file_get_contents(STORE_FILE);
  $data = json_decode($raw, true);
  if (!is_array($data) || empty($data['users'])) {
    $seed = store_seed();
    store_save($seed);
    return $seed;
  }
  return $data;
}

function store_save(array $data): void {
  $dir = dirname(STORE_FILE);
  if (!is_dir($dir)) @mkdir($dir, 0775, true);
  file_put_contents(STORE_FILE, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function store_next(array &$data, string $key): int {
  $data['next'][$key] = (int) ($data['next'][$key] ?? 1);
  return $data['next'][$key]++;
}

function b64url(string $raw): string {
  return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function jwt_sign(array $payload): string {
  $payload['exp'] = time() + 60 * 60 * 24 * 7;
  $header = b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
  $body = b64url(json_encode($payload));
  $sig = b64url(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
  return "$header.$body.$sig";
}

function jwt_verify(?string $token): ?array {
  if (!$token) return null;
  $parts = explode('.', $token);
  if (count($parts) !== 3) return null;
  [$header, $body, $sig] = $parts;
  $expected = b64url(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
  if (!hash_equals($expected, $sig)) return null;
  $payload = json_decode(base64_decode(strtr($body, '-_', '+/')), true);
  if (!is_array($payload) || ($payload['exp'] ?? 0) < time()) return null;
  return $payload;
}

function find_user(array $data, string $email): ?array {
  $email = strtolower(trim($email));
  foreach ($data['users'] as $user) {
    if (($user['email'] ?? '') === $email && !empty($user['active'])) return $user;
  }
  return null;
}

function find_by_id(array $items, $id): ?array {
  foreach ($items as $item) {
    if ((string) ($item['id'] ?? '') === (string) $id) return $item;
  }
  return null;
}
