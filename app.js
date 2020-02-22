const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.static('public')).use(cors());

module.exports = {app};