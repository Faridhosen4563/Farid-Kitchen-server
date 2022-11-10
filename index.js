const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

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

function verifyJWT(req, res, next) {
  const authToken = req.headers.authorization;
  console.log(authToken);
  if (!authToken) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const token = authToken.split(" ")[1];
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, function (er, decoded) {
    if (er) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  const serviceCollection = client.db("cloudKitchen").collection("services");
  const reviewsCollection = client.db("cloudKitchen").collection("reviews");
  const blogCollection = client.db("cloudKitchen").collection("blog");

  try {
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "12h",
      });
      res.send({ token });
    });
    app.get("/services", async (req, res) => {
      const limit = parseInt(req.query.limit);
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);

      const query = {};
      const option = {
        sort: { _id: -1 },
      };
      const cursor = serviceCollection.find(query, option);
      if (limit) {
        const services = await cursor.limit(limit).toArray();
        res.send(services);
      } else {
        const services = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
        const count = await serviceCollection.estimatedDocumentCount();
        res.send({ count, services });
      }
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    app.get("/blog", async (req, res) => {
      const query = {};
      const cursor = blogCollection.find(query);
      const results = await cursor.toArray();
      res.send(results);
    });

    app.post("/services", verifyJWT, async (req, res) => {
      const service = req.body;
      const serviceDoc = {
        name: service.name,
        img: service.img,
        price: service.price,
        description: service.description,
        rating: service.rating,
        Delivery_time: service.Delivery_time,
      };
      const result = await serviceCollection.insertOne(serviceDoc);
      res.send(result);
    });

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const doc = {
        serviceId: review.serviceId,
        name: review.name,
        photoUrl: review.photoUrl,
        email: review.email,
        date: review.date,
        message: review.message,
      };
      const reviews = await reviewsCollection.insertOne(doc);
      res.send(reviews);
    });

    app.get("/reviews", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decoded = req.decoded;
      if (decoded.email !== req.query.email) {
        return res.status(403).send({ message: "Unauthorized access " });
      }
      const query = { email: email };
      const cursor = reviewsCollection.find(query);
      const results = await cursor.toArray();
      res.send(results);
    });

    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { serviceId: id };
      const option = {
        sort: { _id: -1 },
      };
      const cursor = reviewsCollection.find(query, option);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.findOne(query);
      res.send(result);
    });

    app.delete("/reviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/reviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const review = req.body;
      const query = { _id: ObjectId(id) };
      const option = { upsert: true };
      const updateReview = {
        $set: {
          message: review.message,
        },
      };
      const result = await reviewsCollection.updateOne(
        query,
        updateReview,
        option
      );
      res.send(result);
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
