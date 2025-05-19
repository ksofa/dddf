/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Управление категориями
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Получить список всех категорий
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список категорий
 *       401:
 *         description: Неавторизован
 */

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   get:
 *     summary: Получить категорию по ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Информация о категории
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Категория не найдена
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Создать новую категорию
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название категории
 *               description:
 *                 type: string
 *                 description: Описание категории
 *     responses:
 *       201:
 *         description: Категория создана
 *       400:
 *         description: Ошибка валидации или категория с таким названием уже существует
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет прав для создания категории
 */

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   put:
 *     summary: Обновить категорию
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID категории
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название категории
 *               description:
 *                 type: string
 *                 description: Описание категории
 *     responses:
 *       200:
 *         description: Категория обновлена
 *       400:
 *         description: Ошибка валидации или категория с таким названием уже существует
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет прав для обновления категории
 *       404:
 *         description: Категория не найдена
 */

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   delete:
 *     summary: Удалить категорию
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID категории
 *     responses:
 *       200:
 *         description: Категория удалена
 *       400:
 *         description: Нельзя удалить категорию, которая назначена пользователям
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет прав для удаления категории
 *       404:
 *         description: Категория не найдена
 */

/**
 * @swagger
 * /api/categories/{categoryId}/users:
 *   get:
 *     summary: Получить список пользователей категории
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID категории
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Лимит пользователей
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Курсор для пагинации
 *     responses:
 *       200:
 *         description: Список пользователей категории
 *       401:
 *         description: Неавторизован
 *       404:
 *         description: Категория не найдена
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all categories
router.get('/', authenticate, async (req, res) => {
  try {
    const categoriesSnapshot = await db.collection('categories')
      .orderBy('name')
      .get();

    const categories = [];
    categoriesSnapshot.forEach(doc => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get category by ID
router.get('/:categoryId', authenticate, async (req, res) => {
  try {
    const { categoryId } = req.params;

    const categoryDoc = await db.collection('categories').doc(categoryId).get();
    if (!categoryDoc.exists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      id: categoryDoc.id,
      ...categoryDoc.data()
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create new category
router.post('/',
  authenticate,
  checkRole(['presale', 'super-admin']),
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;

      // Check if category with same name exists
      const existingCategory = await db.collection('categories')
        .where('name', '==', name)
        .get();

      if (!existingCategory.empty) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }

      const categoryData = {
        name,
        description,
        createdAt: new Date(),
        createdBy: req.user.uid
      };

      const categoryRef = await db.collection('categories').add(categoryData);

      res.status(201).json({
        message: 'Category created successfully',
        categoryId: categoryRef.id
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ message: 'Error creating category' });
    }
  }
);

// Update category
router.put('/:categoryId',
  authenticate,
  checkRole(['presale', 'super-admin']),
  [
    body('name').optional().trim(),
    body('description').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { categoryId } = req.params;
      const { name, description } = req.body;

      const categoryDoc = await db.collection('categories').doc(categoryId).get();
      if (!categoryDoc.exists) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // If name is being updated, check for duplicates
      if (name) {
        const existingCategory = await db.collection('categories')
          .where('name', '==', name)
          .get();

        if (!existingCategory.empty && existingCategory.docs[0].id !== categoryId) {
          return res.status(400).json({ message: 'Category with this name already exists' });
        }
      }

      const updateData = {
        ...(name && { name }),
        ...(description && { description }),
        updatedAt: new Date(),
        updatedBy: req.user.uid
      };

      await db.collection('categories').doc(categoryId).update(updateData);

      res.json({ message: 'Category updated successfully' });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ message: 'Error updating category' });
    }
  }
);

// Delete category
router.delete('/:categoryId',
  authenticate,
  checkRole(['presale', 'super-admin']),
  async (req, res) => {
    try {
      const { categoryId } = req.params;

      const categoryDoc = await db.collection('categories').doc(categoryId).get();
      if (!categoryDoc.exists) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Check if category is used by any users
      const usersWithCategory = await db.collection('users')
        .where('categories', 'array-contains', categoryId)
        .get();

      if (!usersWithCategory.empty) {
        return res.status(400).json({
          message: 'Cannot delete category that is assigned to users',
          usersCount: usersWithCategory.size
        });
      }

      await db.collection('categories').doc(categoryId).delete();

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: 'Error deleting category' });
    }
  }
);

// Get users by category
router.get('/:categoryId/users',
  authenticate,
  async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { limit = 50, before } = req.query;

      // Check if category exists
      const categoryDoc = await db.collection('categories').doc(categoryId).get();
      if (!categoryDoc.exists) {
        return res.status(404).json({ message: 'Category not found' });
      }

      let query = db.collection('users')
        .where('categories', 'array-contains', categoryId)
        .orderBy('fullName')
        .limit(parseInt(limit));

      if (before) {
        query = query.startAfter(before);
      }

      const usersSnapshot = await query.get();
      const users = [];

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          fullName: userData.fullName,
          email: userData.email,
          profileImage: userData.profileImage,
          roles: userData.roles
        });
      });

      res.json(users);
    } catch (error) {
      console.error('Get users by category error:', error);
      res.status(500).json({ message: 'Error fetching users by category' });
    }
  }
);

module.exports = router; 