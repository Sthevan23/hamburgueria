import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "../..");

const PHOTO = {
  smash: "assets/products/burger-smash.jpg",
  smashBacon: "assets/products/burger-smash-bacon.jpg",
  doubleSmash: "assets/products/burger-double-smash.jpg",
  loaded: "assets/products/burger-loaded.jpg",
  artesanal: "assets/products/burger-artesanal.jpg",
  egg: "assets/products/burger-egg.jpg",
  chicken: "assets/products/burger-chicken.jpg",
  xtudo: "assets/products/burger-xtudo.jpg",
  picanha: "assets/products/burger-picanha.jpg",
  peixe: "assets/products/burger-peixe.jpg",
  simples: "assets/products/burger-simples.jpg",
};

const ROTATE = [
  PHOTO.artesanal,
  PHOTO.egg,
  PHOTO.simples,
  PHOTO.xtudo,
  PHOTO.smashBacon,
  PHOTO.chicken,
  PHOTO.picanha,
  PHOTO.doubleSmash,
  PHOTO.smash,
  PHOTO.loaded,
];

function burgerPhoto(id, category, name = "") {
  const key = `${id} ${name}`.toLowerCase();
  if (key.includes("peixe") || key.includes("tilapia") || key.includes("quaresma")) return PHOTO.peixe;
  if (key.includes("picanha")) return PHOTO.picanha;
  if (key.includes("frango") && !key.includes("tudo")) return PHOTO.chicken;
  if (
    key.includes("tudo") ||
    key.includes("galaxias") ||
    key.includes("sanduiche-falcone") ||
    key.includes("falcone-especial") ||
    key.includes("marmitex")
  ) {
    return PHOTO.xtudo;
  }
  if (category === "smash") {
    if (key.includes("falcone")) return PHOTO.loaded;
    if (key.includes("duplo") || key.includes("double")) return PHOTO.doubleSmash;
    if (key.includes("bacon")) return PHOTO.smashBacon;
    return PHOTO.smash;
  }
  if (key.includes("misto") || key.includes("bauru") || key.includes("americano")) return PHOTO.simples;
  if (key.includes("ovo") || key.includes("egg")) return PHOTO.egg;
  if (key.includes("bacon")) return PHOTO.smashBacon;
  if (["smash", "artesanais", "tradicionais"].includes(category)) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return ROTATE[hash % ROTATE.length];
  }
  return null;
}

const menuPath = path.join(root, "data/menu-seed.json");
const menu = JSON.parse(fs.readFileSync(menuPath, "utf8"));
let changed = 0;
for (const product of menu.products) {
  const next = burgerPhoto(product.id, product.category, product.name);
  if (next && product.image !== next) {
    product.image = next;
    changed += 1;
  }
}
fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2) + "\n");
console.log(`menu-seed.json: ${changed} hambúrgueres atualizados.`);

const dbPath = path.join(root, "data/burger_falcone.db");
if (!fs.existsSync(dbPath)) {
  console.log("Banco ainda não existe — será criado no seed.");
  process.exit(0);
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = DELETE");
const update = db.prepare("UPDATE products SET image_url = ? WHERE slug = ?");
let dbChanged = 0;
for (const product of menu.products) {
  const next = burgerPhoto(product.id, product.category, product.name);
  if (!next) continue;
  const result = update.run(next, product.id);
  dbChanged += result.changes;
}
db.prepare("UPDATE restaurants SET banner_url = ? WHERE slug = ?").run(
  "assets/products/burger-banner.jpg",
  "burger-falcone"
);
console.log(`banco: ${dbChanged} produtos + banner atualizados.`);
db.close();
