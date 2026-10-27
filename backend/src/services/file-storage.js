const crypto = require("crypto");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Private bucket for applicant uploads. Files are never public: admins download
// them through short-lived signed links only.
let client = null;

function isFileStorageConfigured() {
  const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  return Boolean(S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);
}

function getClient() {
  if (client) return client;
  if (!isFileStorageConfigured()) {
    throw new Error("File storage is not configured (S3_* variables missing).");
  }
  client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "auto",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

// Keys are random so an uploaded file name can never influence the storage path.
function buildStorageKey(prefix, extension) {
  return `${prefix}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${extension}`;
}

async function putPrivateObject({ key, body, contentType }) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
}

function toSafeDownloadName(fileName) {
  return String(fileName || "download").replace(/[^\w.\- ]+/g, "_").slice(0, 150) || "download";
}

function getDownloadUrl(key, fileName, expiresIn = 300) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${toSafeDownloadName(fileName)}"`,
    }),
    { expiresIn }
  );
}

module.exports = {
  isFileStorageConfigured,
  buildStorageKey,
  putPrivateObject,
  deleteObject,
  getDownloadUrl,
  toSafeDownloadName,
};
