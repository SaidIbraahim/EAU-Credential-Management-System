"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
class UserController {
    static async createUser(req, res, next) {
        try {
            const user = await user_service_1.UserService.createUser(req.body);
            res.status(201).json({
                status: 'success',
                data: user
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getUsers(req, res, next) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const result = await user_service_1.UserService.getUsers(page, limit);
            res.json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getUserById(req, res, next) {
        try {
            const id = Number(req.params.id);
            const user = await user_service_1.UserService.getUserById(id);
            res.json({
                status: 'success',
                data: user
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateUser(req, res, next) {
        try {
            const id = Number(req.params.id);
            const user = await user_service_1.UserService.updateUser(id, req.body);
            res.json({
                status: 'success',
                data: user
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const id = Number(req.params.id);
            const { currentPassword, newPassword } = req.body;
            const result = await user_service_1.UserService.changePassword(id, currentPassword, newPassword);
            res.json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteUser(req, res, next) {
        try {
            const id = Number(req.params.id);
            const result = await user_service_1.UserService.deleteUser(id);
            res.json({
                status: 'success',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map