require('dotenv').config();

const express = require('express');
const app = express();

const db = require('./db');

app.get('/ping', (req, res) => {
	res.status(200).send('pong');
});

app.get('/db', async (req, res) => {
	const rows = await db.execute('SELECT * FROM user');
	res.status(200).json(rows);
});

// if the port is already in use ==> sudo lsof -i :3000 ==> kill {ID}
const listener = app.listen(process.env.PORT, '0.0.0.0', () =>
	console.log(`http://localhost:${listener.address().port}`)
);
