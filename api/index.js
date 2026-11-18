import { handleRequest } from '../backend/server.mjs';

export default async function handler(req, res) {
  return handleRequest(req, res);
}
