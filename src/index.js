require('dotenv').config();
const express = require('express');
const app = express();

const freelancerRoutes = require('./routes/freelancerRoutes');
const userRoutes = require('./routes/userRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/freelancers', freelancerRoutes);
app.use('/users', userRoutes);

app.get('/roles', (req, res) => {
	const roles = require('./config/roles.json');
	res.status(200).json(roles);
});

app.get('/ping', (req, res) => {
	res.status(200).send('pong');
});

// if the port is already in use ==> sudo lsof -i :3000 ==> kill {ID}
const listener = app.listen(process.env.PORT, '0.0.0.0', () =>
	console.log(`http://localhost:${listener.address().port}`)
);
