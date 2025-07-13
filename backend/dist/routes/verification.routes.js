"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verification_controller_1 = require("../controllers/verification.controller");
const router = (0, express_1.Router)();
router.get('/verify/:identifier', verification_controller_1.VerificationController.verifyStudent);
exports.default = router;
//# sourceMappingURL=verification.routes.js.map