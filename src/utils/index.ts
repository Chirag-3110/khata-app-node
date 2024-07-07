const JWT_SECRET = 'khatak_app'
const jwt = require('jsonwebtoken');

export function generateJWT(user: string,documentId: any) {
    const secretKey = JWT_SECRET || '1234';
    return jwt.sign(
      {
        userId: user,
        documentId: documentId
      },
      secretKey
    );
  }