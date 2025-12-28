const fs = require('fs');
const path = require('path');
const { uploadToS3, FILE_CATEGORIES } = require('../services/fileservice');

const localUploadsDir = path.join(__dirname, '../uploads');

async function migrateLocalFiles() {
  try {
    const files = fs.readdirSync(localUploadsDir);

    for (const fileName of files) {
      const filePath = path.join(localUploadsDir, fileName);
      if (fs.lstatSync(filePath).isFile()) {
        const file = {
          path: filePath,
          originalname: fileName,
          mimetype: getMimeType(fileName)
        };
        try {
          // Determine category based on file path or name pattern
          // For simplicity, using 'documents' category here; adjust as needed
          const category = FILE_CATEGORIES.DOCUMENTS;

          const result = await uploadToS3(file, category);
          console.log(`Uploaded ${fileName} to S3 at key: ${result.key}`);

          // Optionally delete local file after successful upload
          // fs.unlinkSync(filePath);
        } catch (uploadError) {
          console.error(`Failed to upload ${fileName}:`, uploadError);
        }
      }
    }
    console.log('Migration completed.');
  } catch (error) {
    console.error('Error reading local uploads directory:', error);
  }
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.doc': return 'application/msword';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.ppt': return 'application/vnd.ms-powerpoint';
    case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.zip': return 'application/zip';
    default: return 'application/octet-stream';
  }
}

if (require.main === module) {
  migrateLocalFiles();
}

module.exports = {
  migrateLocalFiles
};
