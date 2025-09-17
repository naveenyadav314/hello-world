const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/pokemondb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema & Model
const pokemonSchema = new mongoose.Schema({
  name: String,
  url: String,
});

const Pokemon = mongoose.model("Pokemon", pokemonSchema);

// ✅ Import ALL Pokémon (name + url)
app.get("/import-all", async (req, res) => {
  try {
    let allPokemons = [];
    let nextUrl = "https://pokeapi.co/api/v2/pokemon?limit=100&offset=0";

    while (nextUrl) {
      const response = await axios.get(nextUrl);
      allPokemons = allPokemons.concat(response.data.results); // add batch
      nextUrl = response.data.next; // move to next page
    }

    // Optional: clear previous data to avoid duplicates
    await Pokemon.deleteMany({});

    // Insert into MongoDB
    await Pokemon.insertMany(allPokemons);

    res.json({
      message: "All Pokémon imported successfully",
      count: allPokemons.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET all Pokémon from DB
app.get("/pokemon", async (req, res) => {
  const pokemons = await Pokemon.find();
  res.json(pokemons);
});

// ✅ GET Pokémon by MongoDB ID
app.get("/pokemon/:id", async (req, res) => {
  try {
    const pokemon = await Pokemon.findById(req.params.id);
    if (!pokemon) return res.status(404).json({ message: "Not Found" });
    res.json(pokemon);
  } catch (err) {
    res.status(400).json({ message: "Invalid ID" });
  }
});

// ✅ POST a new Pokémon manually
app.post("/pokemon", async (req, res) => {
  const newPokemon = new Pokemon(req.body);
  await newPokemon.save();
  res.json(newPokemon);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
