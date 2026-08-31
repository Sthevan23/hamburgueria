/* ============================================
   Burger Falcone — Script
   ============================================ */

/** Altere este número para o WhatsApp real da hamburgueria (somente dígitos com DDI). */
let WHATSAPP_NUMBER = "5500000000000";
let storeConfig = { isOpen: true, closedMessage: "Estamos fechados no momento." };

const STORAGE_KEY = "burger_falcone_cart_v2";

/**
 * Cardápio oficial da Burger Falcone.
 * Edite este arquivo para alterar preços, nomes ou descrições.
 *
 * category:
 * "smash" | "artesanais" | "tradicionais" | "porcoes" | "omeletes" |
 * "bebidas" | "cervejas" | "doses" | "adicionais"
 *
 * image: troque a URL por "assets/images/seu-arquivo.jpg" quando tiver fotos locais.
 */
const IMG = {
  smash:
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=700&q=80",
  artesanais:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
  tradicionais:
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=700&q=80",
  porcoes:
    "https://images.unsplash.com/photo-1630431341973-02e1b662ec35?auto=format&fit=crop&w=700&q=80",
  porcoesCompleta:
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=700&q=80",
  porcoesCarne:
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
  porcoesPeixe:
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=700&q=80",
  porcoesFrango:
    "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=700&q=80",
  porcoesMacarrao:
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=700&q=80",
  porcoesBife:
    "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=700&q=80",
  omeletes:
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=700&q=80",
  bebidas:
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=700&q=80",
  cervejas:
    "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80",
  doses:
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=700&q=80",
  adicionais:
    "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=700&q=80",
};

function item(id, name, description, price, category, badge = null, image = null) {
  return {
    id,
    name,
    description,
    price,
    category,
    badge,
    image: image ?? IMG[category] ?? IMG.artesanais,
  };
}

let PRODUCTS = [
  /* ===== Sanduíches Smash ===== */
  item(
    "smash-burguer",
    "Smash Burguer",
    "Pão brioche, alface, tomate, bife smash, 2 fatias de cheddar, barbecue e cebola roxa.",
    22,
    "smash"
  ),
  item(
    "smash-bacon",
    "Smash Bacon",
    "Pão brioche, alface, tomate, bife smash, bacon, 2 fatias de cheddar, barbecue e cebola roxa.",
    26,
    "smash",
    "Popular"
  ),
  item(
    "duplo-smash",
    "Duplo Smash",
    "Pão brioche, alface, tomate, 2 bifes smash, bacon em dobro, 4 fatias de cheddar, barbecue e cebola roxa.",
    30,
    "smash"
  ),
  item(
    "falcone-smash",
    "Falcone Smash",
    "Pão brioche, alface, tomate, 2 bifes smash, 2 ovos, bacon em dobro, frango empanado, 4 fatias de cheddar, barbecue e cebola roxa.",
    34,
    "smash",
    "Destaque"
  ),

  /* ===== Sanduíches Artesanais ===== */
  item(
    "x-artesanal",
    "X Artesanal",
    "Pão brioche, alface, tomate, milho, batata, bife artesanal, presunto e muçarela.",
    22,
    "artesanais"
  ),
  item(
    "x-artesanal-egg",
    "X Artesanal Egg",
    "Pão brioche, alface, tomate, milho, batata, bife artesanal, presunto, ovo e muçarela.",
    24,
    "artesanais"
  ),
  item(
    "x-artesanal-egg-bacon",
    "X Artesanal Egg Bacon",
    "Pão brioche, alface, tomate, milho, batata, bife artesanal, presunto, ovo, bacon e muçarela.",
    26,
    "artesanais"
  ),
  item(
    "x-duplo-artesanal",
    "X Duplo Artesanal",
    "Pão brioche, alface, tomate, milho, batata, 2 bifes artesanais, presunto e muçarela.",
    26,
    "artesanais"
  ),
  item(
    "oreo",
    "Oreo",
    "Pão brioche, alface, tomate, cebola roxa, 2 bifes artesanais, 2 fatias de muçarela e bacon.",
    28,
    "artesanais"
  ),
  item(
    "sparta",
    "Sparta",
    "Pão brioche, alface, tomate, 2 bifes artesanais e 2 fatias de muçarela.",
    25,
    "artesanais"
  ),
  item(
    "saturno",
    "Saturno",
    "Pão brioche, alface, tomate, 3 bifes artesanais e 2 fatias de muçarela.",
    30,
    "artesanais"
  ),
  item(
    "taz-mania",
    "Taz Mania",
    "Pão brioche, 2 bifes artesanais, 2 fatias de tomate, cebola roxa, bacon, frango e cheddar.",
    30,
    "artesanais"
  ),
  item(
    "patolino",
    "Patolino",
    "Pão brioche, bife artesanal, bacon, tomate, cebola roxa e cheddar.",
    25,
    "artesanais"
  ),
  item(
    "jerry",
    "Jerry",
    "Pão brioche, frango empanado, 2 fatias de tomate, cebola roxa e cheddar.",
    26,
    "artesanais"
  ),
  item(
    "frajola",
    "Frajola",
    "Pão brioche, bife artesanal, 2 fatias de tomate, cebola roxa, batata chips e cheddar.",
    26,
    "artesanais"
  ),
  item(
    "galaxias",
    "Galáxias",
    "Pão brioche, alface, tomate, bife artesanal, frango empanado, ovo, muçarela, bacon, cheddar e cebola roxa.",
    32,
    "artesanais",
    "Premium"
  ),
  item(
    "falcone-peixe",
    "Falcone Peixe",
    "Pão brioche, alface, tomate, cebola, ovo, muçarela e filé de tilápia.",
    32,
    "artesanais"
  ),
  item(
    "falcone-caramelo",
    "Falcone Caramelo",
    "Pão brioche, alface, tomate, bife artesanal, muçarela e cebola caramelizada.",
    27,
    "artesanais"
  ),
  item(
    "mega",
    "Mega",
    "Pão brioche, alface, tomate, 2 bifes artesanais, muçarela e ovo.",
    26,
    "artesanais"
  ),
  item(
    "cinderela",
    "Cinderela",
    "Pão brioche, bife artesanal, muçarela, presunto, cebola roxa e 2 fatias de tomate.",
    24,
    "artesanais"
  ),
  item(
    "bumblebee",
    "Bumblebee",
    "Pão brioche, bife artesanal, alface, tomate, cebola roxa, 2 fatias de muçarela e bacon.",
    27,
    "artesanais"
  ),
  item(
    "megatron",
    "Megatron",
    "Pão brioche, tomate, cebola roxa, bife artesanal, frango empanado, cheddar e bacon.",
    32,
    "artesanais"
  ),
  item(
    "optimus-prime",
    "Optimus Prime",
    "Pão brioche, alface, tomate, 2 bifes artesanais, bacon, cebola roxa, cheddar e muçarela.",
    30,
    "artesanais"
  ),
  item(
    "meteoro",
    "Meteoro",
    "Pão brioche, alface, tomate, cebola roxa, bife artesanal, frango empanado e cheddar.",
    28,
    "artesanais"
  ),
  item(
    "double",
    "Double",
    "Pão brioche, alface, tomate, cebola roxa, cheddar e 2 bifes artesanais.",
    28,
    "artesanais"
  ),
  item(
    "mec-lanche",
    "Mec Lanche",
    "Pão brioche, alface, tomate, presunto, muçarela, bacon, ovo, frango e bife artesanal.",
    28,
    "artesanais"
  ),
  item(
    "novo-sanduiche-casa",
    "Novo Sanduíche da Casa",
    "Pão brioche, 2 bifes artesanais, 2 fatias de cheddar, alface, tomate e cebola empanada.",
    32,
    "artesanais",
    "Novo"
  ),
  item(
    "sanduiche-china",
    "Sanduíche China",
    "Pão brioche, cheddar, bife artesanal, bacon, alface, tomate e cebola roxa.",
    32,
    "artesanais"
  ),
  item(
    "sanduiche-falcone",
    "Sanduíche Falcone",
    "Pão brioche, 3 fatias de cheddar, 3 ovos, 3 bifes artesanais, alface, tomate e cebola roxa.",
    44,
    "artesanais",
    "Top"
  ),
  item(
    "sanduiche-bobo-bi",
    "Sanduíche Bobo Bi",
    "Pão brioche, bife artesanal, cheddar, ovo, bacon e muçarela empanada.",
    32,
    "artesanais"
  ),

  /* ===== Sanduíches Tradicionais ===== */
  item("misto", "Misto", "Pão, 2 fatias de presunto e 2 fatias de muçarela.", 14, "tradicionais"),
  item(
    "misto-ovo",
    "Misto com Ovo",
    "Pão, 2 fatias de presunto, 2 fatias de muçarela e ovo.",
    15,
    "tradicionais"
  ),
  item(
    "misto-bacon",
    "Misto com Bacon",
    "Pão, 2 fatias de presunto, 2 fatias de muçarela e bacon.",
    17,
    "tradicionais"
  ),
  item(
    "americano",
    "Americano",
    "Pão de forma, bife, presunto, muçarela, ovo, alface, tomate, milho e batata palha.",
    18,
    "tradicionais"
  ),
  item(
    "bauru",
    "Bauru",
    "Pão de forma, ovo, 2 fatias de presunto, 2 fatias de muçarela, alface, tomate, milho e batata palha.",
    16,
    "tradicionais"
  ),
  item(
    "quaresma",
    "Quaresma",
    "Pão, ovo, 2 fatias de muçarela, alface, tomate, milho e batata palha.",
    16,
    "tradicionais"
  ),
  item(
    "hamburguer",
    "Hambúrguer",
    "Pão, bife, alface, tomate, milho e batata palha.",
    15,
    "tradicionais"
  ),
  item(
    "hamburguer-ovo",
    "Hambúrguer com Ovo",
    "Pão, bife, ovo, alface, tomate, milho e batata palha.",
    17,
    "tradicionais"
  ),
  item(
    "hamburgao",
    "Hamburgão",
    "Pão, 2 bifes, alface, tomate, milho e batata palha.",
    17,
    "tradicionais"
  ),
  item(
    "x-salada",
    "X Salada",
    "Pão, alface, tomate, 2 fatias de presunto, 2 fatias de muçarela, milho e batata palha.",
    15,
    "tradicionais"
  ),
  item(
    "x-burguer",
    "X Burguer",
    "Pão, bife, presunto, muçarela, alface, tomate, milho e batata palha.",
    17,
    "tradicionais"
  ),
  item(
    "x-egg",
    "X Egg",
    "Pão, bife, presunto, muçarela, ovo, alface, tomate, milho e batata palha.",
    18,
    "tradicionais"
  ),
  item(
    "x-duplo",
    "X Duplo",
    "Pão, 2 bifes, presunto, muçarela, alface, tomate, milho e batata palha.",
    19,
    "tradicionais"
  ),
  item(
    "x-frango",
    "X Frango",
    "Pão, bife, frango, presunto, muçarela, alface, tomate, milho e batata palha.",
    21,
    "tradicionais"
  ),
  item(
    "x-bacon",
    "X Bacon",
    "Pão, bife, bacon, presunto, muçarela, alface, tomate, milho e batata palha.",
    21,
    "tradicionais"
  ),
  item(
    "triplo-x",
    "Triplo X",
    "Pão, alface, tomate, milho, batata, bife e 3 fatias de muçarela.",
    18,
    "tradicionais"
  ),
  item(
    "x-egg-bacon",
    "X Egg Bacon",
    "Pão, bife, ovo, bacon, presunto, muçarela, alface, tomate, milho e batata palha.",
    23,
    "tradicionais"
  ),
  item(
    "x-egg-frango",
    "X Egg Frango",
    "Pão, frango, bife, ovo, presunto, muçarela, alface, tomate, milho e batata palha.",
    23,
    "tradicionais"
  ),
  item(
    "x-frango-bacon-especial",
    "X Frango com Bacon Especial",
    "Pão, bife, alface, tomate, milho, batata, frango, presunto, bacon e muçarela.",
    24,
    "tradicionais"
  ),
  item(
    "x-calabresa",
    "X Calabresa",
    "Pão, alface, tomate, milho, batata, bife, presunto, calabresa e muçarela.",
    22,
    "tradicionais"
  ),
  item(
    "x-egg-calabresa",
    "X Egg Calabresa",
    "Pão, alface, tomate, milho, batata, bife, ovo, presunto, calabresa e muçarela.",
    23,
    "tradicionais"
  ),
  item(
    "x-calabresa-egg-bacon",
    "X Calabresa Egg Bacon",
    "Pão, alface, tomate, milho, batata, presunto, ovo, bife, bacon, calabresa e muçarela.",
    25,
    "tradicionais"
  ),
  item(
    "x-tudo",
    "X Tudo",
    "Pão, bife, ovo, bacon, frango, presunto, muçarela, alface, tomate, milho e batata palha.",
    25,
    "tradicionais",
    "Clássico"
  ),
  item(
    "x-picanha",
    "X Picanha",
    "Pão, bife de picanha, presunto, muçarela, alface, tomate, milho e batata palha.",
    21,
    "tradicionais"
  ),
  item(
    "x-picanha-egg",
    "X Picanha Egg",
    "Pão, bife de picanha, ovo, presunto, muçarela, alface, tomate, milho e batata palha.",
    23,
    "tradicionais"
  ),
  item(
    "x-picanha-egg-bacon",
    "X Picanha Egg Bacon",
    "Pão, bife de picanha, bacon, ovo, presunto, muçarela, alface, tomate, milho e batata palha.",
    25,
    "tradicionais"
  ),
  item(
    "x-egg-picanha-frango",
    "X Egg Picanha Frango",
    "Pão, alface, tomate, milho, batata, bife de picanha 120g, presunto, ovo, frango e muçarela.",
    25,
    "tradicionais"
  ),
  item(
    "falcone-especial",
    "Burger Falcone",
    "Pão, 2 bifes, 2 ovos, frango, bacon, presunto, muçarela, alface, tomate, milho e batata palha.",
    28,
    "tradicionais",
    "Da casa"
  ),
  item(
    "falcone-prato",
    "Burger Falcone no Prato",
    "Pão, 2 bifes, 2 ovos, frango, bacon, presunto, muçarela, alface, tomate, milho e batata palha.",
    28,
    "tradicionais"
  ),
  item(
    "novidade-marmitex",
    "Novidade Marmitex",
    "Pão, alface, tomate, milho, batata, 2 bifes, ovo, presunto, bacon, frango, abacaxi, banana, calabresa e muçarela.",
    32,
    "tradicionais",
    "Novo"
  ),

  /* ===== Porções ===== */
  item(
    "contra-file-fritas",
    "Contra Filé c/ Fritas",
    "Porção de contra filé com batata frita.",
    70,
    "porcoes",
    null,
    IMG.porcoesCarne
  ),
  item(
    "contra-file-sem-fritas",
    "Contra Filé s/ Fritas",
    "Porção de contra filé sem batata.",
    60,
    "porcoes",
    null,
    IMG.porcoesCarne
  ),
  item(
    "tilapia-fritas",
    "Filé de Tilápia c/ Fritas",
    "Filé de tilápia com batata frita.",
    70,
    "porcoes",
    null,
    IMG.porcoesPeixe
  ),
  item(
    "tilapia-sem-fritas",
    "Filé de Tilápia s/ Fritas",
    "Filé de tilápia sem batata.",
    60,
    "porcoes",
    null,
    IMG.porcoesPeixe
  ),
  item(
    "batata-completa",
    "Batata Completa",
    "Batata completa com acompanhamentos.",
    35,
    "porcoes",
    null,
    IMG.porcoesCompleta
  ),
  item(
    "batata-simples",
    "Batata Simples",
    "Porção de batata frita simples.",
    30,
    "porcoes",
    null,
    IMG.porcoes
  ),
  item(
    "frango-passarinho-fritas",
    "Frango à Passarinho c/ Fritas",
    "Frango à passarinho com batata frita.",
    60,
    "porcoes",
    null,
    IMG.porcoesFrango
  ),
  item(
    "frango-passarinho-sem-fritas",
    "Frango à Passarinho s/ Fritas",
    "Frango à passarinho sem batata.",
    40,
    "porcoes",
    null,
    IMG.porcoesFrango
  ),
  item(
    "porcao-bife-artesanal",
    "Porção de Bife Artesanal",
    "Porção de bife artesanal.",
    40,
    "porcoes",
    null,
    IMG.porcoesBife
  ),
  item(
    "macarrao-chapa",
    "Macarrão na Chapa",
    "Bacon, frango, cebola, tomate, calabresa, sazón, muçarela e milho.",
    26,
    "porcoes",
    null,
    IMG.porcoesMacarrao
  ),
  item(
    "batata-simples-individual",
    "Batata Simples (Individual)",
    "Porção individual de batata simples.",
    10,
    "porcoes",
    null,
    IMG.porcoes
  ),
  item(
    "batata-completa-individual",
    "Batata Completa (Individual)",
    "Porção individual de batata completa.",
    13,
    "porcoes",
    null,
    IMG.porcoesCompleta
  ),

  /* ===== Omeletes (M / G) ===== */
  item(
    "omelete-simples-m",
    "Omelete Simples (M)",
    "Ovo, cebola, catupiry, presunto, muçarela, milho, tomate e batata palha.",
    18,
    "omeletes"
  ),
  item(
    "omelete-simples-g",
    "Omelete Simples (G)",
    "Ovo, cebola, catupiry, presunto, muçarela, milho, tomate e batata palha.",
    24,
    "omeletes"
  ),
  item(
    "omelete-bacon-m",
    "Omelete de Bacon (M)",
    "Ovo, cebola, catupiry, presunto, muçarela, bacon, milho, tomate e batata palha.",
    22,
    "omeletes"
  ),
  item(
    "omelete-bacon-g",
    "Omelete de Bacon (G)",
    "Ovo, cebola, catupiry, presunto, muçarela, bacon, milho, tomate e batata palha.",
    30,
    "omeletes"
  ),
  item(
    "omelete-frango-m",
    "Omelete de Frango (M)",
    "Ovo, cebola, catupiry, presunto, muçarela, frango, milho, tomate e batata palha.",
    22,
    "omeletes"
  ),
  item(
    "omelete-frango-g",
    "Omelete de Frango (G)",
    "Ovo, cebola, catupiry, presunto, muçarela, frango, milho, tomate e batata palha.",
    30,
    "omeletes"
  ),
  item(
    "omelete-completo-m",
    "Omelete Completo (M)",
    "Ovo, cebola, catupiry, presunto, muçarela, frango, bacon, milho, tomate e batata palha.",
    22,
    "omeletes"
  ),
  item(
    "omelete-completo-g",
    "Omelete Completo (G)",
    "Ovo, cebola, catupiry, presunto, muçarela, frango, bacon, milho, tomate e batata palha.",
    30,
    "omeletes"
  ),
  item(
    "omelete-calabresa-m",
    "Omelete Calabresa (M)",
    "Ovo, cebola, presunto, muçarela, calabresa, catupiry, tomate, milho e batata palha.",
    22,
    "omeletes"
  ),
  item(
    "omelete-calabresa-g",
    "Omelete Calabresa (G)",
    "Ovo, cebola, presunto, muçarela, calabresa, catupiry, tomate, milho e batata palha.",
    30,
    "omeletes"
  ),

  /* ===== Refrigerantes / Água / Sucos / Energéticos ===== */
  item("coca-2l", "Coca-Cola 2 Litros", "Refrigerante Coca-Cola 2 litros.", 20, "bebidas"),
  item("sprite-2l", "Sprite 2 Litros", "Refrigerante Sprite 2 litros.", 17, "bebidas"),
  item("guarana-2l", "Guaraná 2 Litros", "Refrigerante Guaraná 2 litros.", 17, "bebidas"),
  item("fanta-2l", "Fanta 2 Litros", "Refrigerante Fanta 2 litros.", 17, "bebidas"),
  item("mineiro-2l", "Mineiro 2 Litros", "Refrigerante Mineiro 2 litros.", 17, "bebidas"),
  item("mineirinho-15l", "Mineirinho 1,5 Litro", "Refrigerante Mineirinho 1,5 litro.", 15, "bebidas"),
  item("guarana-1l", "Guaraná 1 Litro", "Refrigerante Guaraná 1 litro.", 12, "bebidas"),
  item("coca-600", "Coca-Cola 600 ml", "Refrigerante Coca-Cola 600 ml.", 10, "bebidas"),
  item("fanta-600", "Fanta 600 ml", "Refrigerante Fanta 600 ml.", 10, "bebidas"),
  item("sprite-600", "Sprite 600 ml", "Refrigerante Sprite 600 ml.", 10, "bebidas"),
  item("mineirinho-600", "Mineirinho 600 ml", "Refrigerante Mineirinho 600 ml.", 10, "bebidas"),
  item("coca-lata", "Coca-Cola Lata", "Refrigerante Coca-Cola em lata.", 8, "bebidas"),
  item("fanta-lata", "Fanta Lata", "Refrigerante Fanta em lata.", 8, "bebidas"),
  item("sprite-lata", "Sprite Lata", "Refrigerante Sprite em lata.", 8, "bebidas"),
  item("guarana-lata", "Guaraná Lata", "Refrigerante Guaraná em lata.", 8, "bebidas"),
  item("coca-200", "Coca-Cola 200 ml", "Refrigerante Coca-Cola 200 ml.", 4, "bebidas"),
  item("guarana-200", "Guaraná 200 ml", "Refrigerante Guaraná 200 ml.", 4, "bebidas"),
  item("mineirinho-200", "Mineirinho 200 ml", "Refrigerante Mineirinho 200 ml.", 4, "bebidas"),
  item("agua-sem-gas", "Água 500 ml s/ Gás", "Água mineral sem gás 500 ml.", 4, "bebidas"),
  item("agua-com-gas", "Água 500 ml c/ Gás", "Água mineral com gás 500 ml.", 5, "bebidas"),
  item("h2o-500", "H2O 500 ml", "Bebida H2O 500 ml.", 8, "bebidas"),
  item("delvalle-lata", "Del Valle Lata", "Suco Del Valle em lata.", 8, "bebidas"),
  item("delvalle-1l", "Del Valle 1 Litro", "Suco Del Valle 1 litro.", 12, "bebidas"),
  item("energetico-2l", "Energético 2 Litros", "Energético 2 litros.", 15, "bebidas"),
  item("monster-latao", "Monster Latão", "Energético Monster latão.", 15, "bebidas"),
  item("red-bull", "Red Bull", "Energético Red Bull.", 15, "bebidas"),

  /* ===== Cervejas ===== */
  item("heineken-600", "Heineken 600 ml", "Cerveja Heineken 600 ml.", 17, "cervejas"),
  item("stella-600", "Stella 600 ml", "Cerveja Stella Artois 600 ml.", 17, "cervejas"),
  item("spaten-600", "Spaten 600 ml", "Cerveja Spaten 600 ml.", 17, "cervejas"),
  item("brahma-600", "Brahma 600 ml", "Cerveja Brahma 600 ml.", 14, "cervejas"),
  item("boa-600", "Boa 600 ml", "Cerveja Boa 600 ml.", 14, "cervejas"),
  item("skol-600", "Skol 600 ml", "Cerveja Skol 600 ml.", 14, "cervejas"),
  item("heineken-473", "Heineken 473 ml", "Cerveja Heineken 473 ml.", 12, "cervejas"),
  item("skol-473", "Skol 473 ml", "Cerveja Skol 473 ml.", 10, "cervejas"),
  item("brahma-473", "Brahma 473 ml", "Cerveja Brahma 473 ml.", 10, "cervejas"),
  item("boa-473", "Boa 473 ml", "Cerveja Boa 473 ml.", 10, "cervejas"),
  item("kaiser-473", "Kaiser 473 ml", "Cerveja Kaiser 473 ml.", 10, "cervejas"),
  item("subzero-473", "Sub Zero 473 ml", "Cerveja Sub Zero 473 ml.", 10, "cervejas"),
  item("amstel-473", "Amstel 473 ml", "Cerveja Amstel 473 ml.", 10, "cervejas"),
  item("petra-473", "Petra 473 ml", "Cerveja Petra 473 ml.", 10, "cervejas"),
  item("budweiser-473", "Budweiser 473 ml", "Cerveja Budweiser 473 ml.", 10, "cervejas"),
  item("spaten-473", "Spaten 473 ml", "Cerveja Spaten 473 ml.", 10, "cervejas"),
  item(
    "litrinho",
    "Litrinho",
    "Skol, Brahma, Boa ou Império — informe o sabor nas observações.",
    5,
    "cervejas"
  ),

  /* ===== Doses ===== */
  item("chop-vinho-litro", "Chop Vinho Litro", "Chop de vinho — litro.", 15, "doses"),
  item("pergola-litro", "Pérgola Litro", "Vinho Pérgola — litro.", 36, "doses"),
  item("pergola-copo", "Pérgola Copo", "Vinho Pérgola — copo.", 7, "doses"),
  item("cancao-litro", "Canção Vinho Litro", "Vinho Canção — litro.", 25, "doses"),
  item("cancao-copo", "Canção Vinho Copo", "Vinho Canção — copo.", 5, "doses"),
  item("catuaba-litro", "Catuaba Litro", "Catuaba — litro.", 30, "doses"),
  item("catuaba-copo", "Catuaba Copo", "Catuaba — copo.", 5, "doses"),
  item("conhaque-dose", "Conhaque Dose", "Dose de conhaque.", 5, "doses"),

  /* ===== Adicionais ===== */
  item("add-cheddar", "Cheddar", "Adicional de cheddar.", 3, "adicionais"),
  item("add-cheddar-cremoso", "Cheddar Cremoso", "Adicional de cheddar cremoso.", 2, "adicionais"),
  item("add-catupiry", "Catupiry", "Adicional de catupiry.", 2, "adicionais"),
  item("add-ovo", "Ovo", "Adicional de ovo.", 3, "adicionais"),
  item("add-bife-tradicional", "Bife Tradicional", "Adicional de bife tradicional.", 4, "adicionais"),
  item("add-bife-artesanal", "Bife Artesanal", "Adicional de bife artesanal.", 7, "adicionais"),
  item("add-bife-smash", "Bife Smash", "Adicional de bife smash.", 7, "adicionais"),
  item("add-bife-picanha", "Bife Picanha", "Adicional de bife de picanha.", 7, "adicionais"),
  item("add-bacon", "Bacon", "Adicional de bacon.", 4, "adicionais"),
  item("add-frango", "Frango", "Adicional de frango.", 4, "adicionais"),
  item("add-frango-empanado", "Frango Empanado", "Adicional de frango empanado.", 7, "adicionais"),
  item("add-presunto-mucarela", "Presunto e Muçarela", "Adicional de presunto e muçarela.", 3, "adicionais"),
  item("add-mucarela-empanada", "Muçarela Empanada", "Adicional de muçarela empanada.", 7, "adicionais"),
  item("add-cebola-empanada", "Cebola Empanada", "Adicional de cebola empanada.", 5, "adicionais"),
  item("add-cebola-roxa", "Cebola Roxa", "Adicional de cebola roxa.", 3, "adicionais"),
];


/** @type {{ id: string, qty: number }[]} */
let cart = [];
let activeCategory = "smash";
let searchQuery = "";
let categoryScrollLock = false;
let syncCategoryFromScroll = () => {};

let CATEGORIES = [
  { id: "smash", label: "Smash" },
  { id: "artesanais", label: "Artesanais" },
  { id: "tradicionais", label: "Tradicionais" },
  { id: "porcoes", label: "Porções" },
  { id: "omeletes", label: "Omeletes" },
  { id: "bebidas", label: "Bebidas" },
  { id: "cervejas", label: "Cervejas" },
  { id: "doses", label: "Doses" },
  { id: "adicionais", label: "Adicionais" },
];

let HIGHLIGHT_IDS = [
  "falcone-smash",
  "smash-bacon",
  "galaxias",
  "x-tudo",
  "sanduiche-falcone",
  "batata-completa",
];

/* ---------- Utils ---------- */
function formatPrice(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getProduct(id) {
  return PRODUCTS.find((item) => item.id === id);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cart = parsed.filter(
        (item) => item && typeof item.id === "string" && item.qty > 0 && getProduct(item.id)
      );
    }
  } catch {
    cart = [];
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function lockBody(lock) {
  document.body.classList.toggle("is-locked", lock);
}

function badgeClass(badge) {
  if (!badge) return "";
  const b = badge.toLowerCase();
  if (b.includes("novo")) return "badge--new";
  if (b.includes("promo") || b.includes("destaque") || b.includes("top")) return "badge--promo";
  return "badge--hot";
}

function matchesSearch(product, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    product.name.toLowerCase().includes(q) ||
    product.description.toLowerCase().includes(q)
  );
}

/* ---------- Render ---------- */
function renderCategories() {
  const track = document.getElementById("catsTrack");
  if (!track) return;

  track.innerHTML = CATEGORIES.map(
    (cat) => `
    <button type="button" class="cats__btn${cat.id === activeCategory ? " is-active" : ""}" data-cat="${cat.id}">
      ${cat.label}
    </button>
  `
  ).join("");

  updateCategoryTabs(true);
}

function updateCategoryTabs(scrollIntoView = false) {
  const track = document.getElementById("catsTrack");
  if (!track) return;

  track.querySelectorAll(".cats__btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.cat === activeCategory);
  });

  if (scrollIntoView) {
    requestAnimationFrame(() => {
      const active = track.querySelector(".cats__btn.is-active");
      active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  }
}

function setActiveCategory(catId, scrollTabs = false) {
  if (activeCategory === catId) return;
  activeCategory = catId;
  updateCategoryTabs(scrollTabs);
}

function getCategoryScrollOffset() {
  const cats = document.getElementById("cats");
  if (!cats) return 68;
  return Math.ceil(cats.getBoundingClientRect().height) + 8;
}

function getVisibleCategoryFromScroll() {
  const marker = getCategoryScrollOffset() + 4;
  let current = null;

  for (const cat of CATEGORIES) {
    const section = document.getElementById(`cat-${cat.id}`);
    if (!section) continue;
    if (section.getBoundingClientRect().top <= marker) {
      current = cat.id;
    } else {
      break;
    }
  }

  if (!current) {
    const first = CATEGORIES.find((cat) => document.getElementById(`cat-${cat.id}`));
    current = first?.id ?? activeCategory;
  }

  return current;
}

function scrollToCategory(catId) {
  const section = document.getElementById(`cat-${catId}`);
  if (!section) return;

  categoryScrollLock = true;
  setActiveCategory(catId, true);

  const top = section.getBoundingClientRect().top + window.scrollY - getCategoryScrollOffset();
  window.scrollTo({ top, behavior: "smooth" });

  window.setTimeout(() => {
    categoryScrollLock = false;
  }, 700);
}

function initCategoryScrollSpy() {
  let ticking = false;

  syncCategoryFromScroll = () => {
    if (categoryScrollLock || searchQuery) return;
    const current = getVisibleCategoryFromScroll();
    if (current) setActiveCategory(current, true);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (categoryScrollLock || searchQuery) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        syncCategoryFromScroll();
      });
    },
    { passive: true }
  );

  syncCategoryFromScroll();
}

function productItemHTML(product) {
  return `
    <button type="button" class="product-item" data-add="${product.id}">
      <div class="product-item__content">
        ${
          product.badge
            ? `<div class="product-item__badges"><span class="badge ${badgeClass(product.badge)}">${product.badge}</span></div>`
            : ""
        }
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span class="product-item__price">${formatPrice(product.price)}</span>
      </div>
      <div class="product-item__media">
        <img src="${product.image}" alt="" loading="lazy" width="96" height="96" />
        <span class="product-item__add" aria-hidden="true">+</span>
      </div>
    </button>
  `;
}

function renderHighlights() {
  const wrap = document.getElementById("highlights");
  const block = document.getElementById("destaques");
  if (!wrap || !block) return;

  if (searchQuery) {
    block.classList.add("is-hidden");
    return;
  }

  block.classList.remove("is-hidden");

  const items = HIGHLIGHT_IDS.map(getProduct).filter(Boolean);
  wrap.innerHTML = items
    .map(
      (product) => `
    <button type="button" class="hl-card" data-add="${product.id}">
      <img class="hl-card__img" src="${product.image}" alt="" loading="lazy" width="220" height="120" />
      <div class="hl-card__body">
        ${product.badge ? `<span class="hl-card__badge">${product.badge}</span>` : `<span class="hl-card__badge">Destaque</span>`}
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <span class="hl-card__price">${formatPrice(product.price)}</span>
      </div>
    </button>
  `
    )
    .join("");
}

function renderMenuSections() {
  const root = document.getElementById("menuSections");
  if (!root) return;

  let html = "";
  let totalFound = 0;

  CATEGORIES.forEach((cat) => {
    const items = PRODUCTS.filter(
      (p) => p.category === cat.id && matchesSearch(p, searchQuery)
    );
    if (!items.length) return;
    totalFound += items.length;

    html += `
      <section class="block menu-section" id="cat-${cat.id}" data-category="${cat.id}">
        <h2 class="block__title">${cat.label}</h2>
        <div class="menu-list">
          ${items.map(productItemHTML).join("")}
        </div>
      </section>
    `;
  });

  if (!totalFound) {
    html = `<div class="menu-empty"><p>Nenhum produto encontrado${searchQuery ? ` para "${searchQuery}"` : ""}.</p></div>`;
  }

  root.innerHTML = html;
}

function refreshMenu() {
  renderCategories();
  renderHighlights();
  renderMenuSections();
  syncCategoryFromScroll();
}

/* ---------- Cart ---------- */
function addToCart(productId, qty = 1) {
  const product = getProduct(productId);
  if (!product) return;

  const existing = cart.find((item) => item.id === productId);
  if (existing) existing.qty += qty;
  else cart.push({ id: productId, qty });

  saveCart();
  updateCartUI();
  showToast("Adicionado à sacola!");
}

function setQty(productId, qty) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }
  item.qty = qty;
  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  const count = getCartCount();
  const total = getCartTotal();

  const bagBar = document.getElementById("bagBar");
  const bagCount = document.getElementById("bagBarCount");
  const bagTotal = document.getElementById("bagBarTotal");
  const subtotalEl = document.getElementById("cartSubtotal");
  const totalEl = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartItems = document.getElementById("cartItems");

  if (bagCount) bagCount.textContent = String(count);
  if (bagTotal) bagTotal.textContent = formatPrice(total);
  if (subtotalEl) subtotalEl.textContent = formatPrice(total);
  if (totalEl) totalEl.textContent = formatPrice(total);
  if (checkoutBtn) checkoutBtn.disabled = count === 0;

  if (bagBar) {
    if (count > 0) bagBar.hidden = false;
    else bagBar.hidden = true;
  }

  if (!cartItems) return;

  if (count === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <p><strong>Sacola vazia</strong></p>
        <p>Adicione itens do cardápio para continuar.</p>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart
    .map((item) => {
      const product = getProduct(item.id);
      if (!product) return "";
      return `
        <article class="cart-item" data-cart-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" width="64" height="64" />
          <div class="cart-item__info">
            <h3>${product.name}</h3>
            <p>${formatPrice(product.price)}</p>
          </div>
          <div class="cart-item__controls">
            <div class="qty-controls">
              <button type="button" data-qty-minus="${product.id}" aria-label="Diminuir">-</button>
              <span>${item.qty}</span>
              <button type="button" data-qty-plus="${product.id}" aria-label="Aumentar">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-remove="${product.id}">Remover</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function openCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer || !overlay) return;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  lockBody(true);
}

function closeCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer || !overlay) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  const checkoutOpen = document.getElementById("checkoutOverlay")?.classList.contains("is-open");
  if (!checkoutOpen) lockBody(false);
}

function openCheckout() {
  if (getCartCount() === 0) {
    showToast("Adicione itens à sacola primeiro.");
    return;
  }
  closeCart();
  const overlay = document.getElementById("checkoutOverlay");
  if (!overlay) return;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  lockBody(true);
}

function closeCheckout() {
  const overlay = document.getElementById("checkoutOverlay");
  if (!overlay) return;
  overlay.classList.remove("is-open");
  setTimeout(() => {
    overlay.hidden = true;
  }, 250);
  lockBody(false);
}

function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function validateCheckout(form) {
  let valid = true;
  ["customerName", "customerPhone", "customerAddress", "customerNumber"].forEach((id) => {
    const field = document.getElementById(id);
    if (!field) return;
    const empty = !field.value.trim();
    field.classList.toggle("is-invalid", empty);
    if (empty) valid = false;
  });

  const phone = document.getElementById("customerPhone");
  if (phone && phone.value.replace(/\D/g, "").length < 10) {
    phone.classList.add("is-invalid");
    valid = false;
  }

  const payment = form.querySelector('input[name="payment"]:checked');
  const paymentBox = form.querySelector(".payment-options");
  if (paymentBox) paymentBox.classList.toggle("is-invalid", !payment);
  if (!payment) valid = false;
  return valid;
}

function buildWhatsAppMessage(data) {
  const lines = [
    "*NOVO PEDIDO — Burger Falcone*",
    "",
    `*Cliente:* ${data.name}`,
    `*Telefone:* ${data.phone}`,
    "",
    "*Itens:*",
  ];

  cart.forEach((item) => {
    const product = getProduct(item.id);
    if (!product) return;
    lines.push(`• ${item.qty}x ${product.name} — ${formatPrice(product.price * item.qty)}`);
  });

  lines.push("");
  lines.push(`*Total:* ${formatPrice(getCartTotal())}`);
  lines.push("");
  lines.push("*Endereço:*");
  lines.push(
    `${data.address}, Nº ${data.number}${data.complement ? ` — ${data.complement}` : ""}`
  );
  lines.push("");
  lines.push(`*Pagamento:* ${data.payment}`);
  if (data.notes) {
    lines.push("");
    lines.push(`*Observações:* ${data.notes}`);
  }
  return lines.join("\n");
}

function sendOrderToWhatsApp(data) {
  const message = buildWhatsAppMessage(data);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function syncWhatsAppLinks() {
  document.querySelectorAll('a[href*="wa.me/"]').forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.includes("?text=")) return;
    link.setAttribute("href", `https://wa.me/${WHATSAPP_NUMBER}`);
  });
}

function applyStoreBranding(restaurant) {
  if (!restaurant) return;
  if (restaurant.name) {
    document.querySelectorAll(".store-info__text h1, .app-footer h3").forEach((el) => { el.textContent = restaurant.name; });
    document.title = `${restaurant.name} | Pedido Online`;
  }
  if (restaurant.bannerUrl) {
    const cover = document.querySelector(".store-cover__img");
    if (cover) cover.src = restaurant.bannerUrl;
  }
  if (restaurant.whatsapp) WHATSAPP_NUMBER = restaurant.whatsapp;
  storeConfig = restaurant;
}

async function loadMenuFromAPI() {
  try {
    const res = await fetch("/api/public/menu");
    if (!res.ok) return;
    const data = await res.json();
    PRODUCTS = data.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      badge: p.badge,
      image: p.image,
    }));
    CATEGORIES = data.categories;
    HIGHLIGHT_IDS = data.highlights;
    applyStoreBranding(data.restaurant);
    syncWhatsAppLinks();
  } catch {
    console.warn("Cardápio offline — usando dados locais.");
  }
}

async function submitOrderToAPI(data) {
  try {
    const res = await fetch("/api/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          name: data.name,
          phone: data.phone,
          address: data.address,
          number: data.number,
          complement: data.complement,
        },
        items: cart.map((item) => ({ id: item.id, qty: item.qty })),
        paymentMethod: data.payment,
        notes: data.notes,
        type: "delivery",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Não foi possível registrar o pedido.");
    }
    return await res.json();
  } catch (error) {
    console.warn(error.message);
    return null;
  }
}

function updateStoreStatus() {
  const el = document.getElementById("storeStatus");
  if (!el) return;

  if (storeConfig && storeConfig.isOpen === false) {
    el.textContent = "Fechado";
    el.classList.add("is-closed");
    return;
  }

  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const schedule = storeConfig?.schedule;
  const openDays = schedule?.days || [0, 2, 3, 4, 5, 6];
  const [openH, openM] = (schedule?.open || "18:00").split(":").map(Number);
  const [closeH, closeM] = (schedule?.close || "23:30").split(":").map(Number);
  const open = openDays.includes(day) && minutes >= openH * 60 + openM && minutes < closeH * 60 + closeM;
  el.textContent = open ? "Aberto" : "Fechado";
  el.classList.toggle("is-closed", !open);
}

async function refreshStoreStatus() {
  try {
    const res = await fetch("/api/public/status");
    if (res.ok) {
      const data = await res.json();
      storeConfig = { ...storeConfig, isOpen: data.isOpen, closedMessage: data.closedMessage };
    }
  } catch {}
  updateStoreStatus();
}

/* ---------- Events ---------- */
function initEvents() {
  document.addEventListener("click", (event) => {
    const catBtn = event.target.closest("[data-cat]");
    if (catBtn) {
      const wasSearching = !!searchQuery;
      const catId = catBtn.dataset.cat;
      searchQuery = "";
      const search = document.getElementById("searchInput");
      if (search) search.value = "";
      if (wasSearching) {
        refreshMenu();
        requestAnimationFrame(() => scrollToCategory(catId));
      } else {
        scrollToCategory(catId);
      }
      return;
    }

    const addBtn = event.target.closest("[data-add]");
    if (addBtn) {
      addToCart(addBtn.dataset.add);
      return;
    }

    const plus = event.target.closest("[data-qty-plus]");
    if (plus) {
      const item = cart.find((entry) => entry.id === plus.dataset.qtyPlus);
      if (item) setQty(item.id, item.qty + 1);
      return;
    }

    const minus = event.target.closest("[data-qty-minus]");
    if (minus) {
      const item = cart.find((entry) => entry.id === minus.dataset.qtyMinus);
      if (item) setQty(item.id, item.qty - 1);
      return;
    }

    const remove = event.target.closest("[data-remove]");
    if (remove) removeFromCart(remove.dataset.remove);
  });

  const search = document.getElementById("searchInput");
  search?.addEventListener("input", () => {
    searchQuery = search.value.trim();
    refreshMenu();
  });

  document.getElementById("bagBarBtn")?.addEventListener("click", openCart);
  document.getElementById("closeCart")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("continueShopping")?.addEventListener("click", closeCart);
  document.getElementById("checkoutBtn")?.addEventListener("click", openCheckout);
  document.getElementById("closeCheckout")?.addEventListener("click", closeCheckout);
  document.getElementById("checkoutOverlay")?.addEventListener("click", (event) => {
    if (event.target.id === "checkoutOverlay") closeCheckout();
  });

  const phoneInput = document.getElementById("customerPhone");
  phoneInput?.addEventListener("input", () => {
    phoneInput.value = maskPhone(phoneInput.value);
    phoneInput.classList.remove("is-invalid");
  });

  ["customerName", "customerAddress", "customerNumber"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", (e) => {
      e.target.classList.remove("is-invalid");
    });
  });

  document.querySelectorAll('input[name="payment"]').forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelector(".payment-options")?.classList.remove("is-invalid");
    });
  });

  const form = document.getElementById("checkoutForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateCheckout(form)) {
      showToast("Preencha todos os campos obrigatórios.");
      return;
    }

    if (storeConfig?.isOpen === false) {
      showToast(storeConfig.closedMessage || "Restaurante fechado no momento.");
      return;
    }

    const data = {
      name: document.getElementById("customerName").value.trim(),
      phone: document.getElementById("customerPhone").value.trim(),
      address: document.getElementById("customerAddress").value.trim(),
      number: document.getElementById("customerNumber").value.trim(),
      complement: document.getElementById("customerComplement").value.trim(),
      payment: form.querySelector('input[name="payment"]:checked')?.value || "",
      notes: document.getElementById("customerNotes").value.trim(),
    };

    await submitOrderToAPI(data);
    sendOrderToWhatsApp(data);
    closeCheckout();

    const shouldClear = window.confirm("Pedido enviado! Deseja limpar a sacola?");
    if (shouldClear) clearCart();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeCheckout();
    closeCart();
  });
}

function initLoader() {
  const loader = document.getElementById("loader");
  const hide = () => loader?.classList.add("is-hidden");
  window.addEventListener("load", () => setTimeout(hide, 400));
  if (document.readyState === "complete") setTimeout(hide, 400);
}

function initIcons() {
  if (typeof lucide !== "undefined") lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadMenuFromAPI();
  await refreshStoreStatus();
  loadCart();
  refreshMenu();
  initEvents();
  initCategoryScrollSpy();
  initLoader();
  initIcons();
  syncWhatsAppLinks();
  updateCartUI();
});
