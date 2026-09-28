import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  folderId: z.string().uuid().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  fromPosition: z.number().int().min(0),
  toPosition: z.number().int().min(0),
  parentCommentId: z.string().uuid().optional(),
});

export const permissionSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]),
});

export const folderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
});

export const aiQuestionSchema = z.object({
  documentId: z.string().uuid(),
  question: z.string().min(1).max(1000),
});
