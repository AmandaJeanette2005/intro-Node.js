const bodyParser = require('body-parser')
const mysql = require('mysql2');
const express = require('express')
const app = express()
const port = 2005

//from body-parser
app.use(bodyParser.urlencoded({extended:true}))
//from express
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'jelyshop'
  });

  app.get('/login',(req, res) =>{
    connection.query(
        `SELECT * FROM users`,
        function(err, result, fields){
            res.send(result)
        }
    )
  })

  app.post('/regis',(req, res)=>{
    const bodyParams = req.body
    connection.query(`
    INSERT INTO users(name, username, password, level)
    VALUE ('${bodyParams.name}', '${bodyParams.username}', '${bodyParams.password}', '${bodyParams.level}')

    `, function(err, result, fields){
      res.send("has created")

    })
  })

  app.get('/products',(req, res)=>{
    connection.query(
        `SELECT * FROM products`,
        function(err, result, fields){
            res.send(result)
        }
    )
  })

  app.post('/add-product', (req, res)=>{
    const bodyParser = req.body
    connection.query(`
    INSERT INTO products (product_name, image, price, stock)
    VALUES ('${bodyParser.product_name}', '${bodyParser.image}', '${bodyParser.price}', '${bodyParser.stock}')
    `, function(err, result){
        res.send(result)
    })
  })


  app.post('/add-to-cart', (req, res) => {
    try {
      const bodyParams = req.body;
  
      connection.query(
        `SELECT * FROM products WHERE id = ${bodyParams.product_id} LIMIT 1`,
        function (err, result) {
          if (err) {
            return res.send(`Error when fetching product: ${err}`);
          }
  
          const product = result[0];
          const price = product.price;
          const total = bodyParams.quantity * price;
  
          connection.query(
            `INSERT INTO orders(user_id, product_id, invoice_id, quantity, price_product, total_price) 
            VALUES ('${bodyParams.user_id}', '${product.id}', NULL, '${bodyParams.quantity}', '${price}', '${total}')`,
            function (err, results) {
              if (err) {
                return res.send(`Error when inserting order: ${err}`);
              }
              res.send('Order successfully added to cart.');
            }
          );
        }
      );
    } catch (error) {
      throw error;
    }
  });
  
  app.get('/chart', (req, res) => {
    const bodyParser = req.body

      connection.query(
        `SELECT * FROM orders WHERE invoice_id IS NULL AND user_id = ${bodyParser.user_id}`,
        function (err, result) {
          if (err) {
            return res.send(`Error when fetching orders: ${err}`);
          }
  
          res.send(result);
        }
      );
  });
  

  
  app.post('/checkout', (req, res)=>{
    const bodyParser = req.body
    let total = 0

    //order mengambil totalan harga
    const order = connection.query(`SELECT SUM(total_price) as totalPrice FROM orders WHERE invoice_id IS NULL AND user_id =${bodyParser.user_id}`
    ,function(err, result, fields){
      console.log(result)
        // res.send(result)
        insertData(result[0].totalPrice, bodyParser)
        if(err){
          console.log(`error when fetch invoice: ${err}`)
        }
    } )
    
    function insertData(total, bodyParser){
      
      connection.query(`INSERT INTO invoice (user_id, invoice_no, total_price) VALUES (${bodyParser.user_id},'ADSE${bodyParser.user_id}', ${total})`, 
      function(err, result, fields){
        if(err){
          return res.send(`Error : ${err}`)
        }
        connection.query(`SELECT id FROM invoice WHERE user_id = ${bodyParser.user_id} ORDER BY id DESC LIMIT 1`, function(err, result){
          if(err){
            return res.send(`Error : ${err}`)
          }
          const invoiceID = result[0].id

          console.log(invoiceID,"ini result")
          connection.query(`UPDATE orders SET invoice_id = ${invoiceID} WHERE invoice_id IS NULL AND user_id=${bodyParser.user_id}`)
          res.send({
            res:result,
            msg:"checkout"
          });
        })
      })

  
    }
  })



  app.get('/report-product',(req, res)=>{
    connection.query(`
    SELECT orders.product_id, products.product_name, SUM(orders.quantity) AS total_penjualan, orders.total_price 
    FROM invoice 
    LEFT JOIN orders ON invoice.id = orders.invoice_id 
    LEFT JOIN products ON orders.product_id = products.id 
    GROUP BY products.id 
    ORDER BY total_penjualan DESC
    `, function(err, results, fields){
      res.send(results)
    })
  })

  app.get('/report-belum-checkout', (req, res)=>{
    connection.query(`
    SELECT * FROM orders WHERE invoice_id IS NULL
    `, function(err, result, fields){
      res.send(result)
    })
  })



  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })