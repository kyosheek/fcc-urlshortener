'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const mongo = require('mongodb');
const mongoose = require('mongoose');

const cors = require('cors');

const dns = require('dns');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(
  process.env.DB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true 
});

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', (req, res) => {
  console.log(req.body);
});

app.listen(port, () => {
  console.log('Listening on ', port);
});
