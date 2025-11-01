import pool from "../config/db.js";
import ResponseWrapper from "./ResponseWrapper.js";

export class Users {
  constructor({
    id = null,
    username,
    password,
    email = null,
    nickname = null,
    avatar = null,
    role = 'user',
    status = 1,
    lastLoginTime = null,
    createTime = null,
    updateTime = null,
  }) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.email = email;
    this.nickname = nickname;
    this.avatar = avatar;
    this.role = role;
    this.status = status;
    this.lastLoginTime = lastLoginTime;
    this.createTime = createTime;
    this.updateTime = updateTime;
  }

  // 格式化日期时间的辅助方法
  static formatDateTime(dateTime) {
    if (!dateTime) return null;
    const date = new Date(dateTime);
    return date.toISOString().slice(0, 19).replace("T", " ");
  }

  // 创建用户
  static async create({ username, password, email = null, nickname = null, avatar = null, role = 'user' }) {
    try {
      const [results] = await pool.query(
        `INSERT INTO users (username, password, email, nickname, avatar, role) VALUES (?, ?, ?, ?, ?, ?)`,
        [username, password, email, nickname, avatar, role]
      );
      
      return {
        id: results.insertId,
        username,
        email,
        nickname,
        avatar,
        role
      };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new Error('用户名或邮箱已存在');
      }
      throw new Error(`创建用户失败: ${err.message}`);
    }
  }

  // 根据用户名查找用户
  static async findByUsername(username) {
    try {
      const [rows] = await pool.query(
        `SELECT id, username, password, email, nickname, avatar, role, status, last_login_time, create_time, update_time
         FROM users WHERE username = ?`,
        [username]
      );
      
      if (rows[0]) {
        return new Users({
          ...rows[0],
          lastLoginTime: Users.formatDateTime(rows[0].last_login_time),
          createTime: Users.formatDateTime(rows[0].create_time),
          updateTime: Users.formatDateTime(rows[0].update_time),
        });
      }
      return null;
    } catch (err) {
      throw new Error(`查询用户失败: ${err.message}`);
    }
  }

  // 根据ID查找用户
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT id, username, password, email, nickname, avatar, role, status, last_login_time, create_time, update_time
         FROM users WHERE id = ?`,
        [id]
      );
      
      if (rows[0]) {
        return new Users({
          ...rows[0],
          lastLoginTime: Users.formatDateTime(rows[0].last_login_time),
          createTime: Users.formatDateTime(rows[0].create_time),
          updateTime: Users.formatDateTime(rows[0].update_time),
        });
      }
      return null;
    } catch (err) {
      throw new Error(`查询用户失败: ${err.message}`);
    }
  }

  // 更新用户信息
  static async updateById(id, { email, nickname, avatar }) {
    try {
      const [result] = await pool.query(
        `UPDATE users SET email = ?, nickname = ?, avatar = ?, update_time = CURRENT_TIMESTAMP WHERE id = ?`,
        [email, nickname, avatar, id]
      );
      
      return result.affectedRows > 0;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new Error('邮箱已存在');
      }
      throw new Error(`更新用户信息失败: ${err.message}`);
    }
  }

  // 更新最后登录时间
  static async updateLastLoginTime(id) {
    try {
      await pool.query(
        `UPDATE users SET last_login_time = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );
    } catch (err) {
      console.error(`更新最后登录时间失败: ${err.message}`);
    }
  }

  // Sequelize风格的查询方法（兼容现有代码）
  static async findOne({ where }) {
    try {
      let query = "SELECT id, username, password, email, nickname, avatar, role, status, last_login_time, create_time, update_time FROM users WHERE 1=1";
      const params = [];
      
      if (where.username) {
        query += " AND username = ?";
        params.push(where.username);
      }
      
      if (where.email) {
        query += " AND email = ?";
        params.push(where.email);
      }
      
      const [rows] = await pool.query(query, params);
      
      if (rows[0]) {
        return new Users({
          ...rows[0],
          lastLoginTime: Users.formatDateTime(rows[0].last_login_time),
          createTime: Users.formatDateTime(rows[0].create_time),
          updateTime: Users.formatDateTime(rows[0].update_time),
        });
      }
      return null;
    } catch (err) {
      throw new Error(`查询用户失败: ${err.message}`);
    }
  }

  // 根据主键查找用户（兼容现有代码）
  static async findByPk(id, options = {}) {
    const user = await Users.findById(id);
    if (!user) return null;
    
    // 处理attributes选项（排除密码等字段）
    if (options.attributes && options.attributes.exclude) {
      const userObj = { ...user };
      options.attributes.exclude.forEach(field => {
        if (userObj.hasOwnProperty(field)) {
          delete userObj[field];
        }
      });
      return userObj;
    }
    
    return user;
  }

  // 创建用户（兼容现有代码）
  static async create(userData) {
    const { username, password, email, role = 'user' } = userData;
    
    try {
      const [results] = await pool.query(
        `INSERT INTO users (username, password, email, role, create_time, update_time) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [username, password, email, role]
      );
      
      return {
        id: results.insertId,
        username,
        email,
        role,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new Error('用户名或邮箱已存在');
      }
      throw new Error(`创建用户失败: ${err.message}`);
    }
  }

  // 实例方法：更新用户信息
  async update(updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (key === 'updated_at') {
          fields.push('update_time = CURRENT_TIMESTAMP');
        } else if (key === 'email') {
          fields.push('email = ?');
          values.push(updateData[key]);
        } else if (key === 'avatar') {
          fields.push('avatar = ?');
          values.push(updateData[key]);
        }
      });
      
      if (fields.length === 0) return false;
      
      values.push(this.id);
      const [result] = await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new Error('邮箱已存在');
      }
      throw new Error(`更新用户信息失败: ${err.message}`);
    }
  }

  // 获取用户列表（分页）
  static async getUsers(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const [rows] = await pool.query(
        `SELECT id, username, email, nickname, avatar, role, status, last_login_time, create_time, update_time
         FROM users ORDER BY create_time DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      
      const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM users`);
      
      const users = rows.map(row => new Users({
        ...row,
        lastLoginTime: Users.formatDateTime(row.last_login_time),
        createTime: Users.formatDateTime(row.create_time),
        updateTime: Users.formatDateTime(row.update_time),
      }));
      
      return ResponseWrapper.success({
        page,
        limit,
        total: total,
        data: users,
      });
    } catch (err) {
      return ResponseWrapper.error(`获取用户列表失败: ${err.message}`);
    }
  }
}