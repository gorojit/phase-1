import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";
import cors from "cors";



const app = express();
const port = 3000;
const saltRound=10;
const corsConfig = {
  origin: "*",
  credential: true
};




env.config();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.options("", cors(corsConfig));
app.use(cors(corsConfig));

app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:true,
  cookie: {
    maxAge:1000 * 60 * 60 * 24 * 364,
  },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.set('views', './views');
app.set('view engine','ejs'); 


const db = new pg.Client({
  user:process.env.PG_USER,
  host:process.env.PG_HOST,
  database:process.env.PG_DATABASE,
  password:process.env.PG_PASSWORD,
  port:process.env.PG_PORT,
});
db.connect();



app.get('/', (req, res)=>{
  res.send("index.html");
});




app.get("/login", (req, res) => {
  res.render("login.html");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});


app.get("/customer.html", (req, res) => {
  if (req.isAuthenticated()){
    res.send("customer.html");
  }else{
    res.redirect("login.html");

  }
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()){
    res.render("secrets.ejs");
  }else{
    res.redirect("login.html");

  }
});



app.post("/login", passport.authenticate("local",{
  successRedirect:"/secrets",
 
  failureRedirect:"/login",
}));


app.post("/register", async (req, res) => {
const phone = req.body.username;
const password = req.body.password;
const rpassword = req.body.confirm_password;

if (password === rpassword)
{

        try {
        const checkResult = await db.query("SELECT * FROM users WHERE phone = $1", [
          phone,
        ]);

        if (checkResult.rows.length > 0) {
          res.send("Phone no already exists. Try logging in.");
        } else {
          bcrypt.hash(password,saltRound, async (err,hash) => {
           if (err) {
              console.log("Error hashing password:",err);
            }

            const result = await db.query(
              "INSERT INTO users (phone, password) VALUES ($1, $2) RETURNING *",
              [phone, hash]
            );
            const user = result.rows[0];
            req.login(user,(err) => {
              console.log(err)
              res.redirect("/secrets")

            })

          });

        }
          
     } catch (err) {
       console.log(err);
        }
}
else
{
  
  res.send("password do not match");
}

});




app.post("/login", async (req, res) => {
const phone = req.body.username;
const loginPassword = req.body.password;



});

passport.use(new Strategy(async function verify(username,password,cb){
console.log(username);

  try {
    const result = await db.query("SELECT * FROM users WHERE phone = $1", [
      username,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedHashPassword = user.password;
  
      bcrypt.compare(password,storedHashPassword, (err,result) =>{
  
        if (err){
          return cb(err);
        }else{
          if (result){
            return cb(null,user);
          }else{
            return cb(null,false);
          }
        }
      });
    } else {
      return cb("User not found");
    }
  } catch (err) {
    return bc(err);
  }
}));

passport.serializeUser((user,cb) =>{
  cb(null,user);
});

passport.deserializeUser((user,cb) =>{
  cb(null,user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


