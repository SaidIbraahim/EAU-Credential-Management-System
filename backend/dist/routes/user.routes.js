"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const validate_1 = require("../middleware/validate");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_validator_1 = require("../validators/user.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', (0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'), user_controller_1.UserController.getUsers);
router.get('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'), user_controller_1.UserController.getUserById);
router.post('/', (0, auth_middleware_1.authorize)('SUPER_ADMIN'), (0, validate_1.validate)(user_validator_1.createUserSchema), user_controller_1.UserController.createUser);
router.put('/:id', (0, auth_middleware_1.authorize)('ADMIN', 'SUPER_ADMIN'), (0, validate_1.validate)(user_validator_1.updateUserSchema), user_controller_1.UserController.updateUser);
router.post('/change-password', (0, validate_1.validate)(user_validator_1.changePasswordSchema), user_controller_1.UserController.changePassword);
router.delete('/:id', (0, auth_middleware_1.authorize)('SUPER_ADMIN'), user_controller_1.UserController.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map