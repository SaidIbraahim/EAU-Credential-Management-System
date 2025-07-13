"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ error: 'Unauthorized - No user found' });
        }
        if (!authReq.user.role) {
            return res.status(403).json({ error: 'Forbidden - No role assigned' });
        }
        if (!allowedRoles.includes(authReq.user.role)) {
            return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=authorize.js.map