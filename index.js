const express = require('express')
const app = express()
const port = process.env.PORT || 5000
app.enable('trust proxy');
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/status', (req, res) => {

  res.status(204 ).send("No content");
})

app.get('/info', (req, res) => {
  let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.status(200).json({ url: fullUrl });
})

app.delete('/security', (req, res) => {
  res.status(401 ).send("Unauthorized");
})

app.get('//status', (req, res) => {

  res.status(204 ).send("No content");
})

app.get('//info', (req, res) => {
  let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.status(200).json({ url: fullUrl });
})

app.delete('//security', (req, res) => {
  res.status(401 ).send("Unauthorized");
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})