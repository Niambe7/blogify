const { randomUUID } = require('crypto');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.POSTS_TABLE;

const ok = (body) => ({ statusCode: 200, body: JSON.stringify(body) });
const created = (body) => ({ statusCode: 201, body: JSON.stringify(body) });
const bad = (msg) => ({ statusCode: 400, body: JSON.stringify({ error: msg }) });
const notFound = () => ({ statusCode: 404, body: JSON.stringify({ error: 'Not found' }) });

exports.createPost = async (event) => {
  const userSub = event.requestContext.authorizer?.jwt?.claims?.sub; // auteur = user sub
  if (!userSub) return bad('Unauthorized'); // route protégée
  const body = JSON.parse(event.body || '{}');
  if (!body.title || !body.content) return bad('title and content required');

  const item = {
    postId: randomUUID(),
    title: body.title,
    content: body.content,
    authorSub: userSub,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ddb.put({ TableName: TABLE, Item: item }).promise();
  return created(item);
};

exports.getPost = async (event) => {
  const { id } = event.pathParameters || {};
  const res = await ddb.get({ TableName: TABLE, Key: { postId: id } }).promise();
  if (!res.Item) return notFound();
  return ok(res.Item);
};

exports.listPosts = async () => {
  const res = await ddb.scan({ TableName: TABLE }).promise();
  // en vrai: utiliser une requête paginée + index par createdAt
  return ok(res.Items || []);
};

exports.updatePost = async (event) => {
  const userSub = event.requestContext.authorizer?.jwt?.claims?.sub;
  if (!userSub) return bad('Unauthorized');
  const { id } = event.pathParameters || {};
  const body = JSON.parse(event.body || '{}');

  // sécurité simple: auteur seulement (vérif auteurSub)
  const existing = await ddb.get({ TableName: TABLE, Key: { postId: id } }).promise();
  if (!existing.Item) return notFound();
  if (existing.Item.authorSub !== userSub) return bad('Forbidden');

  const title = body.title ?? existing.Item.title;
  const content = body.content ?? existing.Item.content;

  const updatedAt = new Date().toISOString();
  await ddb.update({
    TableName: TABLE,
    Key: { postId: id },
    UpdateExpression: 'set title = :t, content = :c, updatedAt = :u',
    ExpressionAttributeValues: { ':t': title, ':c': content, ':u': updatedAt },
  }).promise();

  const res = await ddb.get({ TableName: TABLE, Key: { postId: id } }).promise();
  return ok(res.Item);
};

exports.deletePost = async (event) => {
  const userSub = event.requestContext.authorizer?.jwt?.claims?.sub;
  if (!userSub) return bad('Unauthorized');
  const { id } = event.pathParameters || {};
  const existing = await ddb.get({ TableName: TABLE, Key: { postId: id } }).promise();
  if (!existing.Item) return notFound();
  if (existing.Item.authorSub !== userSub) return bad('Forbidden');
  await ddb.delete({ TableName: TABLE, Key: { postId: id } }).promise();
  return ok({ deleted: id });
};
