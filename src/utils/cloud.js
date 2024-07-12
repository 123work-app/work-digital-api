const sharp = require('sharp');
const cloudinary = require('../config/cloudinary');

class Cloud {
	static async upload(files, filename, folder = '', timeout = 120000, retryInterval = 1000) {
		const compressImage = async (filebuffer) => {
			return await sharp(filebuffer)
				.resize(480, 480, {
					fit: 'inside',
					withoutEnlargement: true,
				})
				.jpeg({ quality: 80 })
				.toBuffer();
		};

		const uploadStream = (buffer, filename) => {
			return new Promise((resolve, reject) => {
				const stream = cloudinary.uploader.upload_stream(
					{
						folder: folder,
						resource_type: 'image',
						public_id: filename,
						use_filename: true,
						unique_filename: false,
						overwrite: true,
						invalidate: true,
					},
					(error, result) => {
						if (error) {
							reject(error);
						} else {
							resolve(result);
						}
					}
				);
				stream.end(buffer);
			});
		};

		const retryUpload = async (buffer, filename) => {
			const startTime = Date.now();
			while (Date.now() - startTime < timeout) {
				try {
					const result = await uploadStream(buffer, filename);
					return result;
				} catch (error) {
					if (Date.now() - startTime >= timeout) {
						throw new Error(`O envio de arquivos falhou após ${timeout}ms: ${error.message}`);
					}
					await new Promise((resolve) => setTimeout(resolve, retryInterval));
				}
			}
			throw new Error(`O envio de arquivos falhou após ${timeout}ms: Timed out`);
		};

		const processFile = async (file, filename) => {
			const compressedBuffer = await compressImage(file);
			return await retryUpload(compressedBuffer, filename);
		};

		if (Array.isArray(files)) {
			return Promise.all(files.map((file, index) => processFile(file, `${filename}-${index}`)));
		} else {
			return processFile(files, filename);
		}
	}

	static async delete(filename, timeout = 120000, retryInterval = 1000) {
		const deleteImage = () => {
			return new Promise((resolve, reject) => {
				cloudinary.uploader.destroy(filename, { invalidate: true }, (error, result) => {
					if (error) {
						reject(error);
					} else {
						resolve(result);
					}
				});
			});
		};

		const retryDelete = async () => {
			const startTime = Date.now();
			while (Date.now() - startTime < timeout) {
				try {
					const result = await deleteImage();
					return result;
				} catch (error) {
					if (Date.now() - startTime >= timeout) {
						throw new Error(`A deleção de arquivo falhou após ${timeout}ms: ${error.message}`);
					}
					await new Promise((resolve) => setTimeout(resolve, retryInterval));
				}
			}
			throw new Error(`A deleção de arquivo falhou após ${timeout}ms: Timed out`);
		};

		return retryDelete();
	}
}

module.exports = Cloud;
