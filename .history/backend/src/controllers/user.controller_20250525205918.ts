import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';

export class UserController {
  static async createUser(req: Request, res: Response) {
    const user = await UserService.createUser(req.body);
    res.status(201).json({
      status: 'success',
      data: user
    });
  }

  static async getUsers(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    
    const result = await UserService.getUsers(page, limit);
    res.json({
      status: 'success',
      data: result
    });
  }

  static async getUserById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const user = await UserService.getUserById(id);
    res.json({
      status: 'success',
      data: user
    });
  }

  static async updateUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    const user = await UserService.updateUser(id, req.body);
    res.json({
      status: 'success',
      data: user
    });
  }

  static async changePassword(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { currentPassword, newPassword } = req.body;
    
    const result = await UserService.changePassword(id, currentPassword, newPassword);
    res.json({
      status: 'success',
      data: result
    });
  }

  static async deleteUser(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await UserService.deleteUser(id);
    res.json({
      status: 'success',
      data: result
    });
  }
} 