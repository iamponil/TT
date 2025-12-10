import { Response, NextFunction } from 'express';
import ArticleService from '../services/ArticleService';
import { AuthRequest } from './auth';

/**
 * Roles:
 * - admin
 * - editor
 * - writer (rédacteur)
 */

// Allow editors and admins to edit any article; writers only own articles

// Allow editors and admins to edit any article; writers only own articles

export function canCreateArticle(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  if (!user)
    return res.status(401).json({ message: 'Authentication required' });

  // Lecteur cannot create
  if (user.role === 'Lecteur') {
    return res
      .status(403)
      .json({ message: 'Forbidden: Readers cannot create articles' });
  }

  // Admin, Éditeur, Rédacteur -> OK
  return next();
}

export async function canEditArticle(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  if (!user)
    return res.status(401).json({ message: 'Authentication required' });

  // Admin & Éditeur can edit everything
  if (['Admin', 'Éditeur'].includes(user.role)) return next();

  // Rédacteur -> check ownership
  if (user.role === 'Rédacteur') {
    const articleId = req.params.id;
    const authorId = await ArticleService.getAuthorId(articleId);
    if (authorId && authorId === user.id) return next();
  }

  return res
    .status(403)
    .json({ message: 'Forbidden: cannot edit this article' });
}

// Only admin can delete
export function requireAdminForDelete(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const user = req.user;
  if (!user)
    return res.status(401).json({ message: 'Authentication required' });
  if (user.role !== 'Admin')
    return res.status(403).json({ message: 'Only admins can delete articles' });
  return next();
}
