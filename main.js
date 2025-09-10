const {Client} = require('pg');
const express = require('express');

const app = express();
app.use(express.json());


const con = new Client({
    host: 'localhost',
    user:'postgres',
    port: 5432,
    password:'Gour@v@2002',
    database:'bookmarket'

});

con.connect().then(() => {
    console.log("Database connected successfully");
});

app.post("/users",async(req,res) => {
    const {name,role} = req.body;

    try {
        const result = await con.query(
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
        const result = await con.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching users");
    }
});

app.post("/books", async(req,res) => {
    const {seller_id,title,description,price,image_url} = req.body;

    try {
        const result = await con.query(
            "INSERT INTO books(seller_id, title, description, price, stock, image_url) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
            [seller_id, title, description, price, stock, image_url]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error inserting book");
    }
});

app.get("/books",async(req,res) => {
    try {
        const result = await con.query("SELECT * FROM books");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching books");
    }
});

app.post("/cart", async(req,res) =>{
    const {buyer_id, book_id, quantity} = req.body;

    try {
        const result = await con.query(
            "INSERT INTO cart(buyer_id, book_id, quantity) VALUES($1, $2, $3) RETURNING *",
            [buyer_id, book_id, quantity]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding to cart");
    }
});

app.get("/cart/:buyer_id",async(req,res) => {
    const {buyer_id} = req.params;

    try {
        const result = await con.query(
            "SELECT c.id, b.title, b.price, c.quantity FROM cart c JOIN books b ON c.book_id = b.id WHERE c.buyer_id = $1",
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
        const result = await con.query(
            "INSERT INTO orders(buyer_id, seller_id, book_id, status) VALUES($1, $2, $3, $4) RETURNING *",
            [buyer_id, seller_id, book_id, status]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error placing order");
    }
});

app.get("/orders/:buyer_id", async(req,res) => {

    const {buyer_id} = req.params;

    try {
        const result = await con.query(
            "SELECT o.id, b.title, b.price, o.status FROM orders o JOIN books b ON o.book_id = b.id WHERE o.buyer_id = $1",
            [buyer_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching orders");
    }
});

app.listen(6000, () =>{
    console.log("Server is running on port 6000");
})
