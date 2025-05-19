/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Аутентификация и авторизация
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - roles
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               fullName:
 *                 type: string
 *                 example: Иван Иванов
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["customer"]
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *       400:
 *         description: Ошибка валидации
 *       500:
 *         description: Ошибка сервера
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Успешный вход
 *       401:
 *         description: Неверные учетные данные
 */

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Пользователь не найден
 */

const express = require('express');
const router = express.Router();
const { auth, db } = require('../config/firebase');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Register new user
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').notEmpty().trim(),
    body('roles').isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName, roles } = req.body;

      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: fullName
      });

      // Create user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        fullName,
        email,
        roles,
        createdAt: new Date(),
        profileImage: null,
        contactInfo: {}
      });

      res.status(201).json({
        message: 'User created successfully',
        uid: userRecord.uid
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  }
);

// Login user
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Sign in with email and password
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const token = await auth.createCustomToken(userCredential.user.uid);

      res.json({
        token,
        uid: userCredential.user.uid
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  }
);

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    res.json({
      uid: req.user.uid,
      ...userData
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

module.exports = router; 