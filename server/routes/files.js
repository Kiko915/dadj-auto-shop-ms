// routes/files.js - File Management API

import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import imagekit from '../config/imagekit.js';

const router = express.Router();

/**
 * @route DELETE /api/files/:fileId
 * @desc Delete a file from ImageKit
 * @access Staff, Admin
 * @returns {200} { message: string } - File deleted successfully
 * @returns {404} { message: string, error: 'NOT_FOUND' } - File not found (or already deleted)
 * @returns {500} { message: string, error: string } - Failed to delete file
 */
router.delete('/:fileId', authenticateToken, authorizeRoles(['staff', 'admin']), async (req, res) => {
    try {
        const { fileId } = req.params;

        // NOTE: Strictly restricted to Staff and Admin.
        // Granular ownership check is not implemented. Privileged users are trusted
        // to manage files. This risk is accepted for the current scope.

        await imagekit.deleteFile(fileId);

        return res.status(200).json({
            message: 'File deleted successfully',
        });
    } catch (error) {
        console.error('Delete File Error:', error);

        const statusCode = error.status || error.statusCode || 500;

        return res.status(statusCode).json({
            message: 'Failed to delete file',
            error: error.message || 'DELETE_ERROR',
        });
    }
});

export default router;
