require('dotenv').config();

const express = require('express');
const app = express();

const User = require('./models/user');

app.get('/users', User.getAll);
app.get('/users/:id', User.getOne);
app.delete('/users/:id', User.deleteOne);

app.get('/ping', (req, res) => {
	res.status(200).send('pong');
});

// if the port is already in use ==> sudo lsof -i :3000 ==> kill {ID}
const listener = app.listen(process.env.PORT, '0.0.0.0', () =>
	console.log(`http://localhost:${listener.address().port}`)
);
