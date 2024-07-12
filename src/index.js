require('dotenv').config();
const express = require('express');
const app = express();

const freelancerRoutes = require('./routes/freelancer');
const userRoutes = require('./routes/user');
const upload = require('./config/multer');

const Cloud = require('./utils/cloud');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/freelancers', freelancerRoutes);
app.use('/users', userRoutes);

app.get('/roles', (req, res) => {
	const roles = require('./config/roles.json');
	res.status(200).json(roles);
});

// Upload dummy test
// req.body.username
// req.file
// app.post('/upload', upload.any(), async (req, res) => {
// 	const { username } = req.body;

// 	if (!username || !req.files[0]) {
// 		return res.status(400).json('Please provide your username and profile picture.');
// 	}

// 	try {
// 		console.log(req.files);
// 		// const filename = `${username}`;

// 		// const url = await Cloud.upload(req.file.buffer, filename);

// 		res.status(200).json({ url: req.files[0] });
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({
// 			message: 'Error uploading image to Cloudinary',
// 			error: err.stack,
// 		});
// 	}
// });

app.get('/ping', (req, res) => {
	res.status(200).send('pong');
});

// if the port is already in use ==> sudo lsof -i :3000 ==> kill {ID}
const listener = app.listen(process.env.PORT, '0.0.0.0', () =>
	console.log(`http://localhost:${listener.address().port}`)
);
