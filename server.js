const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { log } = require('console');

const app = express();
app.use(cors());
app.use(bodyParser.json());


mongoose.connect('mongodb://localhost:27017/Expense', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model('User', {
  name: String,
  password: String,
});

const Expense = mongoose.model('Expense', {
  user: mongoose.Schema.Types.ObjectId,
  date: Date,
  amount: Number,
  description: String,
});

const secretKey = '12333333333333333333333333333333'; 


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

// Routes
app.post('/register', async (req, res, next) => {
  const { name, password } = req.body;

  try {
   
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

  
    const hashedPassword = bcrypt.hashSync(password, 10);

 
    const user = new User({ name, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    next(error);
  }
});

app.post('/login', async (req, res, next) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

  
    const token = jwt.sign({ id: user._id, name: user.name }, secretKey);
    console.log(token,"aaaaa")
    res.json({ token });
  } catch (error) {
    next(error);
  }
  
});


function authenticate(req, res, next) {
    console.log(req.headers);

  const token = req.header('x-auth-token');
  console.log(token,"token")

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token' });
  }
}


app.post('/expenses', authenticate, async (req, res, next) => {
  const { date, amount, description } = req.body;
  const expense = new Expense({
    user: req.user.id,
    date,
    amount,
    description,
  });

  try {
    await expense.save();
    res.status(201).json({ message: 'Expense created' });
  } catch (error) {
    next(error);
  }
});



app.get('/expenses', authenticate, async (req, res, next) => {
    const userId = req.user.id;
  
    try {
      
      const Expenses = await Expense.find({ user: userId });
  
      res.json(Expenses);
    } catch (error) {
      next(error);
    }
  });
  


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
