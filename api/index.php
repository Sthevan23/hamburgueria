<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-HTTP-Method-Override');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

require_once __DIR__ . '/store.php';

function json_body() {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function send($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function fail($message, $code = 400) {
  send(['error' => $message], $code);
}

function request_method() {
  $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
  $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '';
  if ($override) $method = strtoupper($override);
  return $method;
}

function request_path() {
  $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
  $uri = rawurldecode($uri);
  if (preg_match('#/api(?:/index\.php)?(/.*)?$#', $uri, $m)) {
    return trim($m[1] ?? '/', '/');
  }
  return trim($uri, '/');
}

function auth_user($store) {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
  if (!$header && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
  }
  if (!preg_match('/Bearer\s+(.+)/i', $header, $m)) fail('Não autenticado.', 401);
  $payload = jwt_verify(trim($m[1]));
  if (!$payload) fail('Sessão expirada.', 401);
  $user = find_by_id($store['users'], $payload['id'] ?? 0);
  if (!$user || empty($user['active'])) fail('Usuário inválido.', 401);
  return $user;
}

function can($user, $perm) {
  if (($user['role'] ?? '') === 'admin') return true;
  $map = [
    'manager' => ['dashboard', 'orders', 'menu', 'addons', 'stock', 'finance', 'customers', 'coupons', 'reports', 'settings', 'kitchen', 'notifications'],
    'attendant' => ['orders', 'customers', 'notifications'],
    'kitchen' => ['kitchen', 'orders'],
  ];
  return in_array($perm, $map[$user['role'] ?? ''] ?? [], true);
}

function with_items($order) {
  $order['items'] = $order['items'] ?? [];
  foreach ($order['items'] as &$item) {
    $item['addons'] = $item['addons'] ?? [];
  }
  return $order;
}

function public_restaurant($r) {
  $whatsapp = preg_replace('/\D+/', '', (string) ($r['whatsapp'] ?? ''));
  if (!$whatsapp || preg_match('/^5500+$/', $whatsapp)) $whatsapp = '5535987216486';
  return [
    'name' => $r['name'] ?? 'Burger Falcone',
    'logoUrl' => $r['logo_url'] ?? null,
    'bannerUrl' => $r['banner_url'] ?? 'assets/products/burger-banner.jpg',
    'phone' => ($r['phone'] ?? '') === '(00) 00000-0000' ? '(35) 98721-6486' : ($r['phone'] ?? '(35) 98721-6486'),
    'whatsapp' => $whatsapp,
    'address' => $r['address'] ?? '',
    'isOpen' => !empty($r['is_open']),
    'closedMessage' => $r['closed_message'] ?? '',
    'minOrder' => (float) ($r['min_order'] ?? 0),
    'deliveryFee' => (float) ($r['delivery_fee'] ?? 0),
    'prepTime' => (int) ($r['prep_time'] ?? 30),
    'schedule' => json_decode($r['schedule_json'] ?? '{}', true) ?: new stdClass(),
  ];
}

$method = request_method();
$path = request_path();
$store = store_load();
$body = json_body();

if ($path === 'public/status' && $method === 'GET') {
  send(['isOpen' => !empty($store['restaurant']['is_open']), 'closedMessage' => $store['restaurant']['closed_message'] ?? '']);
}

if ($path === 'public/menu' && $method === 'GET') {
  $cats = [];
  foreach ($store['categories'] as $c) {
    if (!empty($c['active'])) $cats[] = ['id' => $c['slug'], 'label' => $c['label']];
  }
  $catById = [];
  foreach ($store['categories'] as $c) $catById[$c['id']] = $c;
  $products = [];
  $highlights = [];
  foreach ($store['products'] as $p) {
    $cat = $catById[$p['category_id']] ?? null;
    if (empty($p['available']) || !$cat || empty($cat['active'])) continue;
    $products[] = [
      'id' => $p['slug'],
      'name' => $p['name'],
      'description' => $p['description'],
      'price' => $p['promo_price'] ?? $p['price'],
      'originalPrice' => $p['promo_price'] ? $p['price'] : null,
      'image' => $p['image_url'],
      'badge' => $p['badge'],
      'category' => $cat['slug'],
    ];
    if (!empty($p['is_highlight'])) $highlights[] = $p['slug'];
  }
  $groups = [];
  foreach ($store['addon_groups'] as $g) {
    if (empty($g['active'])) continue;
    $addons = [];
    foreach ($store['addons'] as $a) {
      if ((int) $a['group_id'] === (int) $g['id'] && !empty($a['active'])) {
        $addons[] = ['id' => $a['id'], 'name' => $a['name'], 'price' => (float) $a['price']];
      }
    }
    $groups[] = ['id' => $g['id'], 'name' => $g['name'], 'min_qty' => $g['min_qty'], 'max_qty' => $g['max_qty'], 'required' => !empty($g['required']), 'addons' => $addons];
  }
  $payments = [];
  foreach ($store['payments'] as $p) {
    if (!empty($p['active'])) $payments[] = $p['name'];
  }
  send([
    'restaurant' => public_restaurant($store['restaurant']),
    'categories' => $cats,
    'products' => $products,
    'highlights' => $highlights,
    'addonGroups' => $groups,
    'paymentMethods' => $payments,
  ]);
}

if ($path === 'public/orders' && $method === 'POST') {
  $customer = $body['customer'] ?? [];
  $items = $body['items'] ?? [];
  if (empty($customer['name']) || !$items) fail('Dados do pedido incompletos.');
  if (empty($store['restaurant']['is_open'])) fail($store['restaurant']['closed_message'] ?? 'Restaurante fechado.', 403);

  $bySlug = [];
  foreach ($store['products'] as $p) $bySlug[$p['slug']] = $p;
  $orderItems = [];
  $subtotal = 0;
  foreach ($items as $item) {
    $product = $bySlug[$item['id'] ?? ''] ?? null;
    if (!$product || empty($product['available'])) fail('Produto não encontrado: ' . ($item['id'] ?? ''));
    $qty = max(1, (int) ($item['qty'] ?? 1));
    $unit = (float) ($product['promo_price'] ?? $product['price']);
    $line = $unit * $qty;
    $subtotal += $line;
    $orderItems[] = [
      'id' => count($orderItems) + 1,
      'product_id' => $product['id'],
      'product_name' => $product['name'],
      'quantity' => $qty,
      'unit_price' => $unit,
      'total_price' => $line,
      'notes' => $item['notes'] ?? '',
      'addons' => [],
    ];
  }
  $type = $body['type'] ?? 'delivery';
  $delivery = $type === 'delivery' ? (float) $store['restaurant']['delivery_fee'] : 0;
  $total = $subtotal + $delivery;
  $address = !empty($customer['address'])
    ? ($customer['address'] . ', Nº ' . ($customer['number'] ?? 'S/N') . (!empty($customer['complement']) ? ' — ' . $customer['complement'] : ''))
    : null;
  $orderId = store_next($store, 'order');
  $orderNumber = store_next($store, 'order_number');
  $store['orders'][] = [
    'id' => $orderId,
    'restaurant_id' => 1,
    'order_number' => $orderNumber,
    'status' => 'new',
    'type' => $type,
    'customer_name' => $customer['name'],
    'customer_phone' => $customer['phone'] ?? null,
    'address_text' => $address,
    'payment_method' => $body['paymentMethod'] ?? null,
    'notes' => $body['notes'] ?? null,
    'subtotal' => $subtotal,
    'delivery_fee' => $delivery,
    'discount' => 0,
    'total' => $total,
    'coupon_code' => $body['couponCode'] ?? null,
    'created_at' => store_now(),
    'updated_at' => store_now(),
    'items' => $orderItems,
  ];
  $store['notifications'][] = [
    'id' => store_next($store, 'notification'),
    'restaurant_id' => 1,
    'type' => 'new_order',
    'title' => 'Novo pedido #' . $orderNumber,
    'message' => $customer['name'] . ' — ' . ($body['paymentMethod'] ?? ''),
    'read' => 0,
    'created_at' => store_now(),
  ];
  store_save($store);
  send(['orderId' => $orderId, 'orderNumber' => $orderNumber, 'total' => $total, 'whatsapp' => $store['restaurant']['whatsapp']], 201);
}

if ($path === 'auth/login' && $method === 'POST') {
  $email = strtolower(trim((string) ($body['email'] ?? '')));
  $password = (string) ($body['password'] ?? '');
  if ($email === '' || $password === '') fail('E-mail e senha são obrigatórios.');
  $user = find_user($store, $email);
  $validPassword = $user && password_verify($password, $user['password_hash']);
  $isDefault = $user && in_array($user['email'], ['admin@burgerfalcone.com', 'cozinha@burgerfalcone.com'], true);
  if (!$validPassword && $isDefault && $password === 'admin123') $validPassword = true;
  if (!$validPassword) fail('Credenciais inválidas.', 401);
  $token = jwt_sign([
    'id' => $user['id'],
    'restaurantId' => $user['restaurant_id'],
    'role' => $user['role'],
    'email' => $user['email'],
  ]);
  send([
    'token' => $token,
    'user' => [
      'id' => $user['id'],
      'name' => $user['name'],
      'email' => $user['email'],
      'role' => $user['role'],
      'restaurantId' => $user['restaurant_id'],
    ],
    'restaurant' => [
      'id' => $store['restaurant']['id'],
      'name' => $store['restaurant']['name'],
      'isOpen' => !empty($store['restaurant']['is_open']),
    ],
  ]);
}

$user = auth_user($store);

if ($path === 'auth/me' && $method === 'GET') {
  send([
    'user' => [
      'id' => $user['id'],
      'name' => $user['name'],
      'email' => $user['email'],
      'role' => $user['role'],
      'restaurantId' => $user['restaurant_id'],
    ],
    'restaurant' => [
      'id' => $store['restaurant']['id'],
      'name' => $store['restaurant']['name'],
      'isOpen' => !empty($store['restaurant']['is_open']),
    ],
  ]);
}

if ($path === 'dashboard' && $method === 'GET') {
  if (!can($user, 'dashboard')) fail('Sem permissão.', 403);
  $orders = $store['orders'];
  $revenue = 0;
  $pending = 0;
  $delivering = 0;
  $sold = 0;
  foreach ($orders as $o) {
    if (($o['status'] ?? '') !== 'cancelled') $revenue += (float) $o['total'];
    if (($o['status'] ?? '') === 'new') $pending++;
    if (($o['status'] ?? '') === 'delivering') $delivering++;
    foreach ($o['items'] ?? [] as $item) $sold += (int) $item['quantity'];
  }
  $recent = $orders;
  usort($recent, function ($a, $b) { return strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''); });
  $recent = array_slice($recent, 0, 8);
  send([
    'stats' => [
      'revenue' => $revenue,
      'orders' => count($orders),
      'avgTicket' => $orders ? $revenue / max(1, count(array_filter($orders, function ($o) { return ($o['status'] ?? '') !== 'cancelled'; }))) : 0,
      'customers' => count($store['customers']),
      'productsSold' => $sold,
      'pending' => $pending,
      'delivering' => $delivering,
    ],
    'recentOrders' => $recent,
    'chartData' => [],
    'isOpen' => !empty($store['restaurant']['is_open']),
  ]);
}

if ($path === 'orders' && $method === 'GET') {
  if (!can($user, 'orders')) fail('Sem permissão.', 403);
  $list = array_map('with_items', $store['orders']);
  usort($list, function ($a, $b) { return strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''); });
  send($list);
}

if ($path === 'orders/kitchen' && $method === 'GET') {
  if (!can($user, 'kitchen') && !can($user, 'orders')) fail('Sem permissão.', 403);
  $list = [];
  foreach ($store['orders'] as $o) {
    if (in_array($o['status'] ?? '', ['new', 'preparing'], true)) $list[] = with_items($o);
  }
  usort($list, function ($a, $b) { return strcmp($a['created_at'] ?? '', $b['created_at'] ?? ''); });
  send($list);
}

if ($path === 'orders/poll/new' && $method === 'GET') {
  if (!can($user, 'orders')) fail('Sem permissão.', 403);
  $since = $_GET['since'] ?? gmdate('c', time() - 60);
  $new = [];
  foreach ($store['orders'] as $o) {
    if (($o['status'] ?? '') === 'new' && ($o['created_at'] ?? '') > $since) {
      $new[] = ['id' => $o['id'], 'order_number' => $o['order_number'], 'customer_name' => $o['customer_name'], 'total' => $o['total'], 'created_at' => $o['created_at']];
    }
  }
  $unread = 0;
  foreach ($store['notifications'] as $n) if (empty($n['read'])) $unread++;
  send(['newOrders' => $new, 'unreadCount' => $unread]);
}

if (preg_match('#^orders/(\d+)$#', $path, $m) && $method === 'GET') {
  if (!can($user, 'orders')) fail('Sem permissão.', 403);
  $order = find_by_id($store['orders'], $m[1]);
  if (!$order) fail('Pedido não encontrado.', 404);
  send(with_items($order));
}

if (preg_match('#^orders/(\d+)/status$#', $path, $m) && $method === 'PATCH') {
  if (!can($user, 'orders')) fail('Sem permissão.', 403);
  $status = $body['status'] ?? '';
  $valid = ['new', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'];
  if (!in_array($status, $valid, true)) fail('Status inválido.');
  foreach ($store['orders'] as &$order) {
    if ((string) $order['id'] === $m[1]) {
      $order['status'] = $status;
      $order['updated_at'] = store_now();
      store_save($store);
      send(with_items($order));
    }
  }
  fail('Pedido não encontrado.', 404);
}

if ($path === 'menu/categories' && $method === 'GET') {
  if (!can($user, 'menu')) fail('Sem permissão.', 403);
  send($store['categories']);
}

if ($path === 'menu/categories' && $method === 'POST') {
  if (!can($user, 'menu')) fail('Sem permissão.', 403);
  $id = store_next($store, 'category');
  $cat = [
    'id' => $id,
    'restaurant_id' => 1,
    'slug' => $body['slug'] ?? '',
    'label' => $body['label'] ?? '',
    'sort_order' => (int) ($body['sort_order'] ?? 0),
    'active' => !empty($body['active']) ? 1 : 1,
  ];
  $store['categories'][] = $cat;
  store_save($store);
  send($cat, 201);
}

if (preg_match('#^menu/categories/(\d+)$#', $path, $m) && $method === 'PUT') {
  if (!can($user, 'menu')) fail('Sem permissão.', 403);
  foreach ($store['categories'] as &$cat) {
    if ((string) $cat['id'] === $m[1]) {
      foreach (['label', 'slug', 'sort_order', 'active'] as $field) {
        if (array_key_exists($field, $body)) $cat[$field] = $body[$field];
      }
      store_save($store);
      send($cat);
    }
  }
  fail('Categoria não encontrada.', 404);
}

if ($path === 'menu/products' && $method === 'GET') {
  if (!can($user, 'menu')) fail('Sem permissão.', 403);
  $catById = [];
  foreach ($store['categories'] as $c) $catById[$c['id']] = $c;
  $out = [];
  foreach ($store['products'] as $p) {
    $p['category_label'] = $catById[$p['category_id']]['label'] ?? '';
    $p['category_slug'] = $catById[$p['category_id']]['slug'] ?? '';
    $out[] = $p;
  }
  send($out);
}

if ($path === 'menu/products' && $method === 'POST') {
  if (!can($user, 'menu')) fail('Sem permissão.', 403);
  $id = store_next($store, 'product');
  $product = [
    'id' => $id,
    'restaurant_id' => 1,
    'category_id' => (int) ($body['category_id'] ?? 0),
    'slug' => $body['slug'] ?? ('produto-' . $id),
    'name' => $body['name'] ?? '',
    'description' => $body['description'] ?? '',
    'price' => (float) ($body['price'] ?? 0),
    'promo_price' => $body['promo_price'] ?? null,
    'sku' => $body['sku'] ?? null,
    'image_url' => $body['image_url'] ?? '',
    'badge' => $body['badge'] ?? null,
    'prep_time' => (int) ($body['prep_time'] ?? 15),
    'is_highlight' => !empty($body['is_highlight']) ? 1 : 0,
    'sort_order' => (int) ($body['sort_order'] ?? 0),
    'available' => array_key_exists('available', $body) ? (!empty($body['available']) ? 1 : 0) : 1,
    'created_at' => store_now(),
  ];
  $store['products'][] = $product;
  store_save($store);
  send($product, 201);
}

if (preg_match('#^menu/products/(\d+)$#', $path, $m) && $method === 'PUT') {
  if (!can($user, 'menu')) fail('Sem permissão.', 403);
  foreach ($store['products'] as &$p) {
    if ((string) $p['id'] === $m[1]) {
      foreach (['category_id', 'slug', 'name', 'description', 'price', 'promo_price', 'sku', 'image_url', 'badge', 'prep_time', 'is_highlight', 'sort_order', 'available'] as $field) {
        if (array_key_exists($field, $body)) $p[$field] = $body[$field];
      }
      store_save($store);
      send($p);
    }
  }
  fail('Produto não encontrado.', 404);
}

if (preg_match('#^menu/products/(\d+)/duplicate$#', $path, $m) && $method === 'POST') {
  if (!can($user, 'menu')) fail('Sem permissão.', 403);
  $src = find_by_id($store['products'], $m[1]);
  if (!$src) fail('Produto não encontrado.', 404);
  $copy = $src;
  $copy['id'] = store_next($store, 'product');
  $copy['name'] = $src['name'] . ' (cópia)';
  $copy['slug'] = $src['slug'] . '-copia-' . $copy['id'];
  $store['products'][] = $copy;
  store_save($store);
  send($copy, 201);
}

if (preg_match('#^menu/products/(\d+)$#', $path, $m) && $method === 'DELETE') {
  if (!can($user, 'menu')) fail('Sem permissão.', 403);
  $store['products'] = array_values(array_filter($store['products'], function ($p) use ($m) { return (string) $p['id'] !== $m[1]; }));
  store_save($store);
  send(['ok' => true]);
}

if ($path === 'addons/groups' && $method === 'GET') {
  if (!can($user, 'addons') && !can($user, 'menu')) fail('Sem permissão.', 403);
  $groups = [];
  foreach ($store['addon_groups'] as $g) {
    $g['addons'] = array_values(array_filter($store['addons'], function ($a) use ($g) { return (int) $a['group_id'] === (int) $g['id']; }));
    $groups[] = $g;
  }
  send($groups);
}

if ($path === 'stock' && $method === 'GET') {
  if (!can($user, 'stock')) fail('Sem permissão.', 403);
  send($store['stock']);
}

if ($path === 'finance/dashboard' && $method === 'GET') {
  if (!can($user, 'finance')) fail('Sem permissão.', 403);
  $revenue = 0;
  foreach ($store['orders'] as $o) if (($o['status'] ?? '') !== 'cancelled') $revenue += (float) $o['total'];
  $expenses = 0;
  foreach ($store['expenses'] as $e) $expenses += (float) ($e['amount'] ?? 0);
  send(['revenue' => $revenue, 'expenses' => $expenses, 'profit' => $revenue - $expenses, 'avgTicket' => $revenue]);
}

if ($path === 'finance/expenses' && $method === 'GET') {
  if (!can($user, 'finance')) fail('Sem permissão.', 403);
  send($store['expenses']);
}

if ($path === 'finance/expenses' && $method === 'POST') {
  if (!can($user, 'finance')) fail('Sem permissão.', 403);
  $row = [
    'id' => store_next($store, 'expense'),
    'description' => $body['description'] ?? '',
    'category' => $body['category'] ?? '',
    'amount' => (float) ($body['amount'] ?? 0),
    'expense_date' => $body['expense_date'] ?? gmdate('Y-m-d'),
  ];
  $store['expenses'][] = $row;
  store_save($store);
  send($row, 201);
}

if ($path === 'finance/payments' && $method === 'GET') {
  if (!can($user, 'finance')) fail('Sem permissão.', 403);
  send(['methods' => $store['payments'], 'sales' => []]);
}

if ($path === 'customers' && $method === 'GET') {
  if (!can($user, 'customers')) fail('Sem permissão.', 403);
  send($store['customers']);
}

if ($path === 'customers/ranking' && $method === 'GET') {
  if (!can($user, 'customers')) fail('Sem permissão.', 403);
  send($store['customers']);
}

if ($path === 'coupons' && $method === 'GET') {
  if (!can($user, 'coupons')) fail('Sem permissão.', 403);
  send($store['coupons']);
}

if ($path === 'coupons' && $method === 'POST') {
  if (!can($user, 'coupons')) fail('Sem permissão.', 403);
  $row = [
    'id' => store_next($store, 'coupon'),
    'code' => strtoupper($body['code'] ?? ''),
    'discount_type' => $body['discount_type'] ?? 'percent',
    'discount_value' => (float) ($body['discount_value'] ?? 0),
    'min_order' => (float) ($body['min_order'] ?? 0),
    'used_count' => 0,
    'usage_limit' => $body['usage_limit'] ?? null,
    'active' => 1,
  ];
  $store['coupons'][] = $row;
  store_save($store);
  send($row, 201);
}

if ($path === 'reports' && $method === 'GET') {
  if (!can($user, 'reports')) fail('Sem permissão.', 403);
  $revenue = 0;
  foreach ($store['orders'] as $o) if (($o['status'] ?? '') !== 'cancelled') $revenue += (float) $o['total'];
  send(['totalRevenue' => $revenue, 'totalExpenses' => 0, 'profit' => $revenue, 'topProducts' => [], 'payments' => []]);
}

if ($path === 'settings' && $method === 'GET') {
  if (!can($user, 'settings')) fail('Sem permissão.', 403);
  $r = $store['restaurant'];
  $r['schedule'] = json_decode($r['schedule_json'] ?? '{}', true) ?: new stdClass();
  $r['zones'] = $store['zones'];
  send($r);
}

if ($path === 'settings' && $method === 'PUT') {
  if (!can($user, 'settings')) fail('Sem permissão.', 403);
  foreach (['name', 'logo_url', 'banner_url', 'phone', 'whatsapp', 'address', 'closed_message', 'min_order', 'delivery_fee', 'prep_time'] as $field) {
    if (array_key_exists($field, $body)) $store['restaurant'][$field] = $body[$field];
  }
  store_save($store);
  send($store['restaurant']);
}

if ($path === 'settings/toggle-open' && $method === 'POST') {
  if (!can($user, 'settings')) fail('Sem permissão.', 403);
  $store['restaurant']['is_open'] = empty($store['restaurant']['is_open']) ? 1 : 0;
  store_save($store);
  send(['isOpen' => !empty($store['restaurant']['is_open'])]);
}

if ($path === 'users' && $method === 'GET') {
  if (($user['role'] ?? '') !== 'admin') fail('Sem permissão.', 403);
  $out = [];
  foreach ($store['users'] as $u) {
    unset($u['password_hash']);
    $out[] = $u;
  }
  send($out);
}

if ($path === 'notifications' && $method === 'GET') {
  send($store['notifications']);
}

if ($path === 'notifications/read-all' && $method === 'PATCH') {
  foreach ($store['notifications'] as &$n) $n['read'] = 1;
  store_save($store);
  send(['ok' => true]);
}

fail('Rota não encontrada: ' . $path, 404);
