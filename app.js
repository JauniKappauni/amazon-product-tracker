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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
