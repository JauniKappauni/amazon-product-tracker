const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/", async (req, res) => {
  const link = req.body.link;
  const response = await axios.get(link);
  const $ = cheerio.load(response.data);
  const priceWhole = $(".a-price-whole").first().text();
  const priceFraction = $(".a-price-fraction").first().text();
  const priceSymbol = $(".a-price-symbol").first().text();
  var price = priceWhole + priceFraction + priceSymbol;
  res.send(price);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
