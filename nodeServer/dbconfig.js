const { MongoClient } = require("mongodb");
const client = new MongoClient("mongodb://127.0.0.1:27017");

async function dbconnect() {
  try {
    let con = await client.connect();
    console.log("Database Connected");
    let db = con.db("ChatApplication");
    return db;
  } catch (err) {
    console.error("Database Connection Failed:", err.message);
  }
}

module.exports = dbconnect;