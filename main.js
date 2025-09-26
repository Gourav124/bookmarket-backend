const {Client} = require('pg');
const { Pool } = require ('pg');
const express = require('express');

require('dotenv').config()

const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Book Market API is running!', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// const con = new Client({
//     host: 'localhost',
//     user:'postgres',
//     port: 5432,
//     password:'Gour@v@2002',
//     database:'bookmarket'

// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect().then(() => {
    console.log("Database connected successfully");
});

app.post("/users",async(req,res) => {
    const {name,role} = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO users(name,role) VALUES($1,$2) RETURNING *",
            [name,role]
        );
        res.json(result.rows[0])
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Error inserting user")
    }
});

app.get("/users",async(req,res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching users");
    }
});

app.post("/books", async(req,res) => {
    const {seller_id,title,description,price,stock,image_url} = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO books(seller_id, title, description, price, stock, image_url) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
            [seller_id, title, description, price, stock, image_url]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error inserting book");
    }
});

app.get("/books/:seller_id", async (req, res) => {
    const sellerId = parseInt(req.params.seller_id, 10);

    if (isNaN(sellerId)) {
        return res.status(400).send("Invalid seller_id");
    }

    try {
        const result = await pool.query(
            "SELECT * FROM books WHERE seller_id = $1",
            [sellerId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching books");
    }
});


app.get("/books",async(req,res) => {
    try {
        const result = await pool.query(
            `SELECT b.*, u.name as seller_name 
             FROM books b 
             JOIN users u ON b.seller_id = u.id`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching books");
    }
});

app.post("/cart", async(req,res) =>{
    const {buyer_id, book_id, quantity,title,price} = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO cart(buyer_id, book_id, quantity,title,price) VALUES($1, $2, $3,$4,$5) RETURNING *",
            [buyer_id, book_id, quantity,title,price]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding to cart");
    }
});

app.get("/cart/:buyer_id", async (req, res) => {
  const buyer_id = parseInt(req.params.buyer_id, 10); // just assign number
  if (isNaN(buyer_id)) return res.status(400).send("Invalid buyer_id");

  try {
    const result = await pool.query(
      `SELECT c.id, b.title, b.price, c.quantity
       FROM cart c
       JOIN books b ON c.book_id = b.id
       WHERE c.buyer_id = $1`,
      [buyer_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching cart items");
  }
});


app.post("/orders", async(req,res) => {
    const {buyer_id, seller_id, book_id, status} = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO orders(buyer_id, seller_id, book_id, status) VALUES($1, $2, $3, $4) RETURNING *",
            [buyer_id, seller_id, book_id, status]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error placing order");
    }
});

app.get("/orders/:seller_id", async(req,res) => {

    const {seller_id} = req.params;

    try {
        const result = await pool.query(
            `SELECT o.id, b.title, b.price, o.status, u.name as buyer_name 
             FROM orders o 
             JOIN books b ON o.book_id = b.id 
             JOIN users u ON o.buyer_id = u.id 
             WHERE o.seller_id = $1`,
            [seller_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching orders");
    }
});

// Update order status
app.put("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Order not found");
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating order status");
  }
});


// Get both buyer and seller accounts for a user
app.get("/users/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, role FROM users WHERE name = $1",
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows); // e.g. [{id:1,role:'buyer'},{id:2,role:'seller'}]
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching user roles");
  }
});

app.delete("/cart/:id", async (req, res) => {
    const cartId = parseInt(req.params.id, 10);

    if (isNaN(cartId)) {
        return res.status(400).send("Invalid cart item id");
    }

    try {
        const result = await pool.query(
            "DELETE FROM cart WHERE id = $1 RETURNING *",
            [cartId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Cart item not found");
        }

        res.json({ message: "Cart item removed", item: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error removing cart item");
    }
});



const PORT = process.env.PORT || 6000;

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`);
})

module.exports = app;
