require('dotenv').config();
const express = require('express');
const app = express();

const IS_DEV = process.env.ENV === 'DEV';

const freelancerRoutes = require('./routes/freelancer');
const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/role');
const conversationRoutes = require('./routes/conversation');
const messageRoutes = require('./routes/message');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/freelancers', freelancerRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/conversations', conversationRoutes);
app.use('/messages', messageRoutes);

app.get('/ping', (req, res) => {
	res.status(200).send('pong');
});

// if the port is already in use ==> sudo lsof -i :3000 ==> kill {ID}
if (IS_DEV) {
	const listener = app.listen(process.env.PORT, '0.0.0.0', () =>
		console.log(`http://localhost:${listener.address().port}`)
	);
} else {
	modules.export = app;
}
