/**
 * AWS S3 utility functions for file upload, delete operations
 * Extracted from server actions to be used across different modules
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Upload any file to S3 (Public Bucket)
 * @param file - File to upload
 * @param folderPath - Folder path in S3 bucket (e.g., 'products', 'users/avatars')
 * @param fileName - Custom filename (optional, will use original name if not provided)
 * @returns Object containing file URL and S3 key
 */
export async function uploadFileToS3(
  file: File | Buffer,
  folderPath: string,
  fileName?: string
) {
  const MAX_FILE_SIZE_BYTES =
    Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024;

  // Handle file size validation
  const fileSize = file instanceof File ? file.size : file.length;
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File size exceeds ${process.env.MAX_FILE_SIZE_MB || 10} MB`
    );
  }

  // Prepare file buffer
  let fileBuffer: Buffer;
  let contentType: string;
  let originalName: string;

  if (file instanceof File) {
    fileBuffer = Buffer.from(await file.arrayBuffer());
    contentType = file.type;
    originalName = file.name;
  } else {
    fileBuffer = file;
    contentType = "application/octet-stream";
    originalName = fileName || "uploaded-file";
  }

  // Generate unique filename
  const timestamp = Date.now();
  const uniqueFilename = fileName || `${timestamp}-${originalName}`;
  const s3Key = `${folderPath}/${uniqueFilename}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
  };

  try {
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log("File uploaded successfully:", result);

    // Generate file URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return {
      success: true,
      key: s3Key,
      url: fileUrl,
      fileName: uniqueFilename,
    };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Delete file from S3 bucket
 * @param s3Key - S3 object key to delete
 * @returns Boolean indicating success
 */
export async function deleteFileFromS3(s3Key: string): Promise<boolean> {
  if (!s3Key) {
    console.warn("No S3 key provided for deletion");
    return false;
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: s3Key,
      })
    );
    console.log("File deleted successfully:", s3Key);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    return false;
  }
}

/**
 * Delete multiple files from S3 bucket
 * @param s3Keys - Array of S3 object keys to delete
 * @returns Array of deletion results
 */
export async function deleteMultipleFilesFromS3(
  s3Keys: string[]
): Promise<{ key: string; success: boolean }[]> {
  const results = await Promise.allSettled(
    s3Keys.map(async (key) => ({
      key,
      success: await deleteFileFromS3(key),
    }))
  );

  return results.map((result, index) => ({
    key: s3Keys[index],
    success: result.status === "fulfilled" ? result.value.success : false,
  }));
}

/**
 * Extract S3 key from full S3 URL
 * @param s3Url - Full S3 URL
 * @returns S3 key or null if invalid URL
 */
export function extractS3KeyFromUrl(s3Url: string): string | null {
  if (!s3Url) return null;

  try {
    // Handle both formats:
    // https://bucket-name.s3.region.amazonaws.com/key
    // https://s3.region.amazonaws.com/bucket-name/key
    const amazonawsMatch = s3Url.match(/\.amazonaws\.com\/(.+)$/);
    if (amazonawsMatch) {
      return amazonawsMatch[1];
    }
    return null;
  } catch (error) {
    console.error("Error extracting S3 key from URL:", error);
    return null;
  }
}

/**
 * Upload product images to S3
 * @param files - Array of files to upload
 * @param productId - Product ID for folder organization
 * @returns Array of uploaded file information
 */
export async function uploadProductImages(
  files: File[],
  productId: bigint
): Promise<{ url: string; key: string }[]> {
  const folderPath = `products/${productId}`;

  const uploadPromises = files.map(async (file) => {
    const result = await uploadFileToS3(file, folderPath);
    return {
      url: result.url,
      key: result.key,
    };
  });

  return Promise.all(uploadPromises);
}

/**
 * Replace product images - delete old ones and upload new ones
 * @param newFiles - New files to upload
 * @param oldImageUrls - Old image URLs to delete
 * @param productId - Product ID for folder organization
 * @returns Array of new uploaded file information
 */
export async function replaceProductImages(
  newFiles: File[],
  oldImageUrls: string[],
  productId: bigint
): Promise<{ url: string; key: string }[]> {
  // Delete old images first
  if (oldImageUrls.length > 0) {
    const oldKeys = oldImageUrls
      .map(extractS3KeyFromUrl)
      .filter((key): key is string => key !== null);

    if (oldKeys.length > 0) {
      await deleteMultipleFilesFromS3(oldKeys);
    }
  }

  // Upload new images
  return uploadProductImages(newFiles, productId);
}
