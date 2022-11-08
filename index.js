const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rmfwbvj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  const serviceCollection = client.db("cloudKitchen").collection("services");

  try {
    app.get("/services", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const query = {};
      const cursor = serviceCollection.find(query);
      if (limit) {
        const services = await cursor.limit(limit).toArray();
        res.send(services);
      } else {
        const services = await cursor.toArray();
        const count = serviceCollection.estimatedDocumentCount();
        res.send({ count, services });
      }
    });
  } finally {
  }
}

run().catch((er) => console.error(er));

app.get("/", (req, res) => {
  res.send("Farid-Kitchen sever is running");
});
app.listen(port, (req, res) => {
  console.log(`Server is running on port ${port}`);
});
