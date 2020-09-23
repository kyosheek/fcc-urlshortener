'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');

const mongo = require('mongodb');
const mongoose = require('mongoose');

const cors = require('cors');

const dns = require('dns');
const urlreq = require('url');
const crypto = require('crypto');

const app = express();

const port = process.env.PORT || 3000;

const dbc = mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (err) => {
    if (err) console.log(err);
    console.log('db connection successful');
  });

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    unique: true
  }
});

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

const db = mongoose.model('short_urls', urlSchema);

app.post('/api/shorturl/new',
  (req, res, next) => {
    let { url } = req.body;
    const urlRegex = /^(https?:\/\/)([a-zA-Z_]+\.)?[-a-zA-Z0-9@:%_\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}(\/[-a-zA-Z0-9@:%_\+~#=]+)*$/;
    if (!urlRegex.test(url)) {
      console.log(`error in url: ${url}`);
      return res.send({ error: "invalid URL" });
    }
    dns.lookup(urlreq.parse(url).hostname, (err) => {
      if (err) {
        console.log(err);
        return res.send({ error: "invalid URL" });
      }
      const hash = crypto.createHash('sha1');
      hash.update(url);
      req.hash = hash.digest('hex');
      next();
    })
  },
  (req, res, next) => {
    db.find({ hash: req.hash }, (err, data) => {
      if (err) {
        console.log(`error in db.find(): ${err}`);
        return res.send({ error: "error in db" });
      }
      if (data.length == 0) {
        next();
      } else {
        return res.send({ error: 'URL exists' });
      }
    })
  },
  (req, res) => {
    let length = 0;
    db
    .find({})
    .then(data => {
      db.create(
        {
          original_url: req.body.url,
          hash: req.hash,
          short_url: data.length
        },
        (err, data) => {
          if (err) {
            console.log(`error in db.create(): ${err}`);
            res.send({ error: 'error while creating short url' });
          } else {
            res.json({
              original_url: req.body.url,
              short_url: data.short_url
            })
          }
        })
      },
        err => {
          console.log(`error in db.find(): ${err}`);
          res.send(`error whule creating short url`);
        }
    );
  }
);

app.get('/api/shorturl/:short_url', (req, res) => {
  db.findOne({ short_url: req.params.short_url }, (err, data) => {
    if (err) {
      console.log(`err in db.findOne(): ${err}`);
      return res.send({ error: "no matching short URL "});
    }
    res.redirect(data.original_url);
  })
});

app.listen(port, () => {
  console.log('Listening on ', port);
});
