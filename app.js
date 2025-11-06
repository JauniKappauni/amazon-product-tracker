const express = require("express");
const sqlite3 = require("sqlite3");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();
const port = 3000;

const db = new sqlite3.Database("./products.db");

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, link TEXT, price TEXT, image TEXT)"
  );
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    res.render("index", { products: rows });
  });
});

app.post("/", async (req, res) => {
  const link = req.body.link;
  const response = await axios.get(link);
  const $ = cheerio.load(response.data);
  const name = $(".a-size-large.product-title-word-break").text().trim();
  const priceWhole = $(".a-price-whole").first().text();
  const priceFraction = $(".a-price-fraction").first().text();
  const priceSymbol = $(".a-price-symbol").first().text();
  var price = priceWhole + priceFraction + priceSymbol;
  const image = $(".a-dynamic-image").attr("src");
  db.run(
    "INSERT INTO products (name, link, price, image) VALUES (?,?,?,?)",
    [name, link, price, image],
    (err, rows) => {
      if (err) {
        return res.send(err);
      }
      res.redirect("/");
    }
  );
});

async function checkPriceDelta() {
  db.all("SELECT name, price, link FROM products", async (err, rows) => {
    for (let i = 0; i < rows.length; i++) {
      try {
        const link = rows[i].link;
        const oldPrice = rows[i].price;
        const name = rows[i].name;
        const response = await axios.get(link);
        const $ = cheerio.load(response.data);
        const priceWhole = $(".a-price-whole").first().text();
        const priceFraction = $(".a-price-fraction").first().text();
        const priceSymbol = $(".a-price-symbol").first().text();
        const price = priceWhole + priceFraction + priceSymbol;
        if (oldPrice == price) {
          console.log("No price change for " + name.slice(0, 10));
          continue;
        }
        db.run("UPDATE products SET price = ? WHERE link = ?", [price, link]);
        console.log("updated " + name.slice(0, 10) + " to " + price);
      } catch (err) {
        console.error("You probably got rate limited or got another error rn");
      }
    }
  });
}

app.get("/product/:id", (req, res) => {
  productId = req.params.id;
  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, rows) => {
    res.render("product", { product: rows });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  setInterval(checkPriceDelta, 60 * 1000);
});
