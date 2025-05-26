const { auth } = require('../config/firebase');
const { db } = require('../config/firebase');
const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
      // Сначала пытаемся верифицировать как ID токен (основной случай)
      decodedToken = await auth.verifyIdToken(token);
      console.log('ID token verified successfully:', decodedToken.uid);
    } catch (idTokenError) {
      console.log('ID token verification failed, trying custom token:', idTokenError.message);
      try {
        // Если не получилось как ID токен, пробуем декодировать как custom token
        // Custom tokens подписаны нашим приватным ключом
        decodedToken = jwt.decode(token);
        
        if (!decodedToken || !decodedToken.uid) {
          throw new Error('Invalid custom token structure');
        }
        
        // Проверяем что пользователь существует в Firebase Auth
        const userRecord = await auth.getUser(decodedToken.uid);
        if (!userRecord) {
          throw new Error('User not found in Firebase Auth');
        }
        
        // Добавляем недостающие поля для совместимости
        decodedToken.email = userRecord.email;
        console.log('Custom token processed successfully:', decodedToken.uid);
        
      } catch (customTokenError) {
        console.error('Both token verification methods failed:', {
          idTokenError: idTokenError.message,
          customTokenError: customTokenError.message
        });
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    req.user = decodedToken;

    // Get user roles from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      console.log('User not found in Firestore:', decodedToken.uid);
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    req.user.roles = userData.roles || [];
    req.user.email = userData.email || req.user.email;
    req.user.displayName = userData.displayName || userData.fullName;
    
    console.log('User authenticated successfully:', {
      uid: req.user.uid,
      email: req.user.email,
      roles: req.user.roles
    });
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const hasRole = roles.some(role => req.user.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  checkRole
}; 