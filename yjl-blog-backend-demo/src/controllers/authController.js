import { Users } from "../models/Users.js";
import ResponseWrapper from "../models/ResponseWrapper.js";
import { generateToken, generateRefreshToken, verifyRefreshToken, hashPassword, comparePassword } from "../utils/auth.js";
import { sanitizeText } from "../utils/security.js";

// 用户注册
export const register = async (req, res) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json(ResponseWrapper.error("用户名、邮箱和密码不能为空"));
    }

    // 清理输入数据
    const sanitizedUsername = sanitizeText(username.trim());
    const sanitizedEmail = sanitizeText(email.trim().toLowerCase());

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json(ResponseWrapper.error("邮箱格式不正确"));
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json(ResponseWrapper.error("密码长度至少为6位"));
    }

    // 检查用户名是否已存在
    const existingUser = await Users.findOne({ 
      where: { 
        username: sanitizedUsername 
      } 
    });

    if (existingUser) {
      return res.status(400).json(ResponseWrapper.error("用户名已存在"));
    }

    // 检查邮箱是否已存在
    const existingEmail = await Users.findOne({ 
      where: { 
        email: sanitizedEmail 
      } 
    });

    if (existingEmail) {
      return res.status(400).json(ResponseWrapper.error("邮箱已存在"));
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await Users.create({
      username: sanitizedUsername,
      email: sanitizedEmail,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user", // 防止普通用户注册为管理员
      created_at: new Date(),
      updated_at: new Date()
    });

    // 生成令牌
    const token = generateToken({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    });
    
    const refreshToken = generateRefreshToken({ 
      id: user.id, 
      username: user.username 
    });

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return res.json(ResponseWrapper.success({
      user: userResponse,
      token,
      refreshToken
    }));
  } catch (error) {
    console.error("用户注册失败:", error);
    return res.status(500).json(ResponseWrapper.error("用户注册失败"));
  }
};

// 用户登录
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json(ResponseWrapper.error("用户名和密码不能为空"));
    }

    // 查找用户
    const user = await Users.findOne({ 
      where: { 
        username: sanitizeText(username.trim()) 
      } 
    });

    if (!user) {
      return res.status(401).json(ResponseWrapper.error("用户名或密码错误"));
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(ResponseWrapper.error("用户名或密码错误"));
    }

    // 生成令牌
    const token = generateToken({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    });
    
    const refreshToken = generateRefreshToken({ 
      id: user.id, 
      username: user.username 
    });

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return res.json(ResponseWrapper.success({
      user: userResponse,
      token,
      refreshToken
    }));
  } catch (error) {
    console.error("用户登录失败:", error);
    return res.status(500).json(ResponseWrapper.error("用户登录失败"));
  }
};

// 刷新令牌
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(ResponseWrapper.error("刷新令牌不能为空"));
    }

    // 验证刷新令牌
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json(ResponseWrapper.error("刷新令牌无效"));
    }

    // 查找用户
    const user = await Users.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json(ResponseWrapper.error("用户不存在"));
    }

    // 生成新的访问令牌
    const newToken = generateToken({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    });

    return res.json(ResponseWrapper.success({
      token: newToken
    }));
  } catch (error) {
    console.error("刷新令牌失败:", error);
    return res.status(500).json(ResponseWrapper.error("刷新令牌失败"));
  }
};

// 获取用户信息
export const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await Users.findByPk(userId, {
      attributes: { exclude: ['password'] } // 不包含密码
    });

    if (!user) {
      return res.status(404).json(ResponseWrapper.error("用户不存在"));
    }

    return res.json(ResponseWrapper.success(user));
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return res.status(500).json(ResponseWrapper.error("获取用户信息失败"));
  }
};

// 更新用户信息
export const updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, avatar } = req.body;

    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json(ResponseWrapper.error("用户不存在"));
    }

    // 更新字段
    const updateData = {};
    if (email) {
      const sanitizedEmail = sanitizeText(email.trim().toLowerCase());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return res.status(400).json(ResponseWrapper.error("邮箱格式不正确"));
      }
      updateData.email = sanitizedEmail;
    }
    
    if (avatar) {
      updateData.avatar = sanitizeText(avatar.trim());
    }

    updateData.updated_at = new Date();

    await user.update(updateData);

    // 返回更新后的用户信息（不包含密码）
    const userResponse = await Users.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    return res.json(ResponseWrapper.success(userResponse));
  } catch (error) {
    console.error("更新用户信息失败:", error);
    return res.status(500).json(ResponseWrapper.error("更新用户信息失败"));
  }
};