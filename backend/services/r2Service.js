const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Inicializar el cliente S3 para Cloudflare R2
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Sube un archivo a Cloudflare R2 y retorna la URL pública
 * @param {Buffer} fileBuffer - El buffer del archivo desde multer
 * @param {string} originalName - El nombre original del archivo
 * @returns {Promise<string>} - La URL pública de la imagen
 */
async function uploadFileToR2(fileBuffer, originalName) {
    const ext = originalName.split('.').pop() || 'jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = `${uniqueSuffix}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        // Optional: you can dynamically set the content type if needed
        // ContentType: 'image/jpeg', 
    });

    try {
        await r2Client.send(command);
        // Construir y retornar la URL pública
        return `https://imagenes.grupocameci.com/${fileName}`;
    } catch (error) {
        console.error('Error subiendo archivo a R2:', error);
        throw error;
    }
}

module.exports = {
    uploadFileToR2
};
