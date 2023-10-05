const express = require('express');
const app = express();
const PORT = process.env.PORT || 3009;
const bodyParser = require('body-parser');
const router = require('./routes/router');
require('dotenv').config();
const cors = require('cors');


app.use(cors());
app.use(bodyParser.json());
app.use(router);



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
