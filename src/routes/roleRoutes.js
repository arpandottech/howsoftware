const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/permissionMiddleware');
const { getRoles, createRole, updateRole, deleteRole } = require('../controllers/roleController');

router.use(protect);
router.use(protectAdmin); // Roles are managed by Admins only

router.route('/')
    .get(getRoles)
    .post(createRole);

router.route('/:id')
    .put(updateRole)
    .delete(deleteRole);

module.exports = router;
