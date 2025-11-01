import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import ResponseWrapper from "../models/ResponseWrapper.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// 生成JWT令牌
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 验证JWT令牌
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 密码加密
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// 验证密码
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT中间件
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(ResponseWrapper.error("访问令牌缺失"));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json(ResponseWrapper.error("访问令牌无效或已过期"));
  }

  req.user = decoded;
  next();
};

// 可选的JWT中间件（不强制要求认证）
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

// 管理员权限中间件
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(ResponseWrapper.error("需要登录"));
  }

  if (req.user.role !== "admin") {
    return res.status(403).json(ResponseWrapper.error("需要管理员权限"));
  }

  next();
};

// 生成刷新令牌
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET + "_refresh", { expiresIn: "7d" });
};

// 验证刷新令牌
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET + "_refresh");
  } catch (error) {
    return null;
  }
};