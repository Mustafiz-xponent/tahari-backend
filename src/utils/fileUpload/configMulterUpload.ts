// utils/configMulterUpload.ts
import multer from "multer";

// Configure multer for file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024, // Default 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

interface IMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
export function multerFileToFileObject(multerFile: IMulterFile): File {
  // Create a Blob from the buffer
  const blob = new Blob([multerFile.buffer], { type: multerFile.mimetype });

  // Create a File from the Blob
  return new File([blob], multerFile.originalname, {
    type: multerFile.mimetype,
    lastModified: Date.now(),
  });
}
