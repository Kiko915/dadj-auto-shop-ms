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

        if (!fileId) {
            return res.status(400).json({
                message: 'File ID is required',
                error: 'MISSING_FILE_ID',
            });
        }

        await imagekit.deleteFile(fileId);

        return res.status(200).json({
            message: 'File deleted successfully',
        });
    } catch (error) {
        console.error('Delete File Error:', error);
        return res.status(500).json({
            message: 'Failed to delete file',
            error: 'DELETE_ERROR',
        });
    }
});

export default router;
