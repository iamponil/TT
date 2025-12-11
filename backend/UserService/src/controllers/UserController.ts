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

  // GET /api/v1/users/summary
  public async getSummary(req: Request, res: Response) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [total, activeLast30Days, newLast30Days] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      ]);

      return res.json({
        total,
        activeLast30Days,
        newLast30Days,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/v1/users/signups-by-day?days=30
  public async getSignupsByDay(req: Request, res: Response) {
    try {
      const days = req.query.days ? Number(req.query.days) : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Fill in missing days with 0 counts
      const daysArray: string[] = [];
      const countsArray: number[] = [];
      const resultMap = new Map(results.map((r: any) => [r._id, r.count]));

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        daysArray.push(dateStr);
        countsArray.push(resultMap.get(dateStr) || 0);
      }

      return res.json({ days: daysArray, counts: countsArray });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/v1/users/by-role
  public async getUsersByRole(req: Request, res: Response) {
    try {
      const results = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return res.json(
        results.map((r: any) => ({
          role: r._id,
          count: r.count,
        }))
      );
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/v1/users/active-per-hour?hours=24
  public async getActivePerHour(req: Request, res: Response) {
    try {
      const hours = req.query.hours ? Number(req.query.hours) : 24;
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);

      const results = await User.aggregate([
        {
          $match: {
            updatedAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%H:00', date: '$updatedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Fill in all 24 hours
      const hoursArray: string[] = [];
      const countsArray: number[] = [];
      const resultMap = new Map(results.map((r: any) => [r._id, r.count]));

      for (let i = 0; i < hours; i++) {
        const hour = i.toString().padStart(2, '0') + ':00';
        hoursArray.push(hour);
        countsArray.push(resultMap.get(hour) || 0);
      }

      return res.json({ hours: hoursArray, counts: countsArray });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  // GET /api/v1/users/top-contributors?limit=10
  public async getTopContributors(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      
      // This requires connecting to ArticleService database
      // For now, returning mock data structure
      // In production, you'd want to use a shared database or microservice communication
      
      const users = await User.find()
        .select('name email')
        .limit(limit)
        .lean();

      return res.json(
        users.map((u: any) => ({
          userId: u._id.toString(),
          name: u.name,
          articles: Math.floor(Math.random() * 100), // Mock data
          comments: Math.floor(Math.random() * 500), // Mock data
        }))
      );
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new UserController();
