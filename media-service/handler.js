const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const BUCKET = process.env.MEDIA_BUCKET;

const ok = (body) => ({ statusCode: 200, body: JSON.stringify(body) });
const bad = (msg) => ({ statusCode: 400, body: JSON.stringify({ error: msg }) });

exports.getUploadUrl = async (event) => {
  const userSub = event.requestContext.authorizer?.jwt?.claims?.sub;
  if (!userSub) return bad('Unauthorized');
  const { filename, contentType } = JSON.parse(event.body || '{}');
  if (!filename || !contentType) return bad('filename and contentType required');

  const Key = `users/${userSub}/${Date.now()}-${filename}`;
  const params = { Bucket: BUCKET, Key, Expires: 300, ContentType: contentType };
  const url = await s3.getSignedUrlPromise('putObject', params);
  return ok({ uploadUrl: url, key: Key });
};

exports.getDownloadUrl = async (event) => {
  const { key } = event.queryStringParameters || {};
  if (!key) return bad('key required');
  const url = await s3.getSignedUrlPromise('getObject', { Bucket: BUCKET, Key: key, Expires: 300 });
  return ok({ downloadUrl: url });
};
