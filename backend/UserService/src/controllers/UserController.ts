import { Request, Response } from 'express';
import User from '../models/User';
import { validationResult } from 'express-validator';

class UserController {
  // GET /users/me
  public async me(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ message: 'Not authenticated' });

      const user = await User.findById(userId).select('-password');
      if (!user) return res.status(404).json({ message: 'User not found' });

      return res.json({ user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // PATCH /users/:id/role  (Admin only)
  public async updateRole(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { role } = req.body;
    try {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.role = role;
      await user.save();

      return res.json({
        message: 'Role updated',
        user: { id: user._id, role: user.role },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /users (Admin only)
  public async getAllUsers(req: Request, res: Response) {
    try {
      // Map _id to id for frontend compatibility
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      const mappedUsers = users.map(user => {
          const u = user.toObject();
          return { ...u, id: u._id };
      });
      return res.json(mappedUsers);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new UserController();
