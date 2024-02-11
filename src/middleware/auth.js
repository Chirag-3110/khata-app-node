// import { Request, Response, NextFunction } from 'express';
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'chirag_chat_app';


function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token is required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error(err);
      return res.status(401).json({ message: 'Invalid token' });
    }
    req["user"] = decoded 
    next();
  });
}
module.exports = verifyToken;