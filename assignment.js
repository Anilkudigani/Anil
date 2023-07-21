const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });

async function connectToDB() {
  await client.connect();
}

function generateShortURL() {
}

async function shortenURL(destinationURL) {
  const db = client.db('url_shortener');
  const shortURL = generateShortURL();
  const expiryDate = new Date(); 
  expiryDate.setDate(expiryDate.getDate() + 30); 
  await db.collection('url_mappings').insertOne({
    shortURL,
    destinationURL,
    expiryDate,
    createdAt: new Date(),
  });

  return shortURL;
}

async function updateShortURL(shortURL, newDestinationURL) {
  const db = client.db('url_shortener');

  const result = await db.collection('url_mappings').findOneAndUpdate(
    { shortURL },
    { $set: { destinationURL: newDestinationURL } },
  );

  return result.ok === 1;
}

async function getDestinationURL(shortURL) {
  const db = client.db('url_shortener');

  const result = await db.collection('url_mappings').findOne({ shortURL });

  if (result && result.expiryDate > new Date()) {
    return result.destinationURL;
  } else {
    return null;
  }
}

async function updateExpiry(shortURL, daysToAdd) {
  const db = client.db('url_shortener');

  const result = await db.collection('url_mappings').findOneAndUpdate(
    { shortURL },
    { $set: { expiryDate: new Date(new Date().getTime() + daysToAdd * 86400000) } }, 
  );

  return result.ok === 1;
}

app.post('/shorten', async (req, res) => {
  const destinationURL = req.body.destinationURL;
  const shortURL = await shortenURL(destinationURL);
  res.send(`Shortened URL: www.ppa.in/${shortURL}`);
});

app.get('/:shortURL', async (req, res) => {
  const shortURL = req.params.shortURL;
  const destinationURL = await getDestinationURL(shortURL);
  if (destinationURL) {
    res.redirect(destinationURL);
  } else {
    res.status(404).send('URL not found or has expired.');
  }
});

connectToDB();

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});