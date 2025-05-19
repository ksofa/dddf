/**
 * @swagger
 * tags:
 *   - name: Documents
 *     description: Управление документами проекта
 */

/**
 * @swagger
 * /api/projects/{projectId}/documents:
 *   get:
 *     summary: Получить список документов проекта
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID проекта
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [contract, specification, report, other]
 *         description: Фильтр по типу документа
 *       - in: query
 *         name: uploadedBy
 *         schema:
 *           type: string
 *         description: Фильтр по загрузившему
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Лимит документов
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Курсор для пагинации
 *     responses:
 *       200:
 *         description: Список документов
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к проекту
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/documents:
 *   post:
 *     summary: Загрузить документ
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID проекта
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - name
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Файл для загрузки (PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG)
 *               name:
 *                 type: string
 *                 description: Название документа
 *               description:
 *                 type: string
 *                 description: Описание документа
 *               type:
 *                 type: string
 *                 enum: [contract, specification, report, other]
 *                 description: Тип документа
 *     responses:
 *       201:
 *         description: Документ загружен
 *       400:
 *         description: Ошибка валидации или неверный тип файла
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к проекту
 *       404:
 *         description: Проект не найден
 */

/**
 * @swagger
 * /api/projects/{projectId}/documents/{documentId}:
 *   delete:
 *     summary: Удалить документ
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID проекта
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID документа
 *     responses:
 *       200:
 *         description: Документ удален
 *       401:
 *         description: Неавторизован
 *       403:
 *         description: Нет доступа к проекту
 *       404:
 *         description: Проект или документ не найдены
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticate, checkRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only specific file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get project documents
router.get('/projects/:projectId/documents', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, uploadedBy, limit = 50, before } = req.query;

    // Check if user has access to project
    const projectDoc = await db.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectDoc.data();
    const hasAccess = 
      project.customerId === req.user.uid ||
      project.pmId === req.user.uid ||
      (project.team && project.team.includes(req.user.uid)) ||
      req.user.roles.includes('presale') ||
      req.user.roles.includes('super-admin');

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view project documents' });
    }

    let query = db.collection('projects')
      .doc(projectId)
      .collection('documents');

    if (type) {
      query = query.where('type', '==', type);
    }

    if (uploadedBy) {
      query = query.where('uploadedBy', '==', uploadedBy);
    }

    query = query.orderBy('uploadedAt', 'desc').limit(parseInt(limit));

    if (before) {
      query = query.startAfter(before);
    }

    const documentsSnapshot = await query.get();
    const documents = [];

    for (const doc of documentsSnapshot.docs) {
      const document = doc.data();

      // Get uploader details
      const uploaderDoc = await db.collection('users').doc(document.uploadedBy).get();
      const uploaderData = uploaderDoc.exists ? uploaderDoc.data() : null;

      documents.push({
        id: doc.id,
        ...document,
        uploader: uploaderData ? {
          id: document.uploadedBy,
          fullName: uploaderData.fullName,
          profileImage: uploaderData.profileImage
        } : null
      });
    }

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

// Upload document
router.post('/projects/:projectId/documents',
  authenticate,
  upload.single('file'),
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('type').optional().isIn(['contract', 'specification', 'report', 'other'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { projectId } = req.params;
      const { name, description, type = 'other' } = req.body;

      // Check if user has access to project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      const hasAccess = 
        project.customerId === req.user.uid ||
        project.pmId === req.user.uid ||
        (project.team && project.team.includes(req.user.uid)) ||
        req.user.roles.includes('presale') ||
        req.user.roles.includes('super-admin');

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to upload documents' });
      }

      const documentData = {
        name,
        description,
        type,
        fileType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedBy: req.user.uid,
        uploadedAt: new Date()
      };

      const documentRef = await db.collection('projects')
        .doc(projectId)
        .collection('documents')
        .add(documentData);

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'document_uploaded',
          userId: req.user.uid,
          details: {
            documentId: documentRef.id,
            name,
            type
          },
          timestamp: new Date()
        });

      // Create notifications
      const notifications = [];

      // Notify customer
      if (project.customerId !== req.user.uid) {
        notifications.push({
          type: 'document_uploaded',
          title: 'New Document Uploaded',
          message: `New document "${name}" has been uploaded to project "${project.title}"`,
          projectId,
          documentId: documentRef.id,
          read: false,
          createdAt: new Date()
        });
      }

      // Notify PM if not the uploader
      if (project.pmId && project.pmId !== req.user.uid) {
        notifications.push({
          type: 'document_uploaded',
          title: 'New Document Uploaded',
          message: `New document "${name}" has been uploaded to project "${project.title}"`,
          projectId,
          documentId: documentRef.id,
          read: false,
          createdAt: new Date()
        });
      }

      // Send notifications
      for (const notification of notifications) {
        await db.collection('users')
          .doc(notification.type === 'document_uploaded' ? project.customerId : project.pmId)
          .collection('notifications')
          .add(notification);
      }

      res.status(201).json({
        message: 'Document uploaded successfully',
        documentId: documentRef.id
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({ message: 'Error uploading document' });
    }
  }
);

// Delete document
router.delete('/projects/:projectId/documents/:documentId',
  authenticate,
  async (req, res) => {
    try {
      const { projectId, documentId } = req.params;

      // Check if user has access to project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const project = projectDoc.data();
      const hasAccess = 
        project.customerId === req.user.uid ||
        project.pmId === req.user.uid ||
        req.user.roles.includes('presale') ||
        req.user.roles.includes('super-admin');

      if (!hasAccess) {
        return res.status(403).json({ message: 'Not authorized to delete documents' });
      }

      // Get document details
      const documentDoc = await db.collection('projects')
        .doc(projectId)
        .collection('documents')
        .doc(documentId)
        .get();

      if (!documentDoc.exists) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const document = documentDoc.data();

      // Delete file from storage
      const fs = require('fs');
      if (fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
      }

      // Delete document from database
      await documentDoc.ref.delete();

      // Create activity log
      await db.collection('projects')
        .doc(projectId)
        .collection('activity')
        .add({
          type: 'document_deleted',
          userId: req.user.uid,
          details: {
            documentId,
            name: document.name
          },
          timestamp: new Date()
        });

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
);

module.exports = router; 