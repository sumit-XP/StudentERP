import pool from "../../config/db.js";

// ==================== ANNOUNCEMENTS ====================

// Create Announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      announcementType = 'general', 
      targetAudience, 
      classId, 
      scheduledAt, 
      expiresAt 
    } = req.body;
    const { uid } = req.user;

    if (!title || !content || !targetAudience) {
      return res.status(400).json({ error: "Title, content, and target audience are required" });
    }

    // Get creator ID
    const userResult = await pool.query("SELECT id FROM users WHERE uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const createdBy = userResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO announcements (title, content, announcement_type, target_audience, class_id, created_by, scheduled_at, expires_at, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, content, announcementType, targetAudience, classId, createdBy, scheduledAt, expiresAt, req.tenantId]
    );

    // Create notifications for target audience
    await createNotificationsForAnnouncement(result.rows[0]);

    res.status(201).json({
      message: "Announcement created successfully",
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
};

// Helper function to create notifications for announcement
async function createNotificationsForAnnouncement(announcement) {
  try {
    let targetUsers = [];
    const roleAudienceMap = {
      students: 'student',
      teachers: 'teacher',
      parents: 'parent',
      admins: 'admin',
      student: 'student',
      teacher: 'teacher',
      parent: 'parent',
      admin: 'admin',
    };

    if (announcement.target_audience === 'all') {
      const result = await pool.query("SELECT id FROM users WHERE is_active = true AND school_id = $1", [announcement.school_id]);
      targetUsers = result.rows.map(row => row.id);
    } else if (announcement.target_audience === 'class_specific' && announcement.class_id) {
      // Get all students and their parents in the specific class
      const result = await pool.query(`
        SELECT DISTINCT u.id 
        FROM users u 
        WHERE u.id IN (
          SELECT s.user_id FROM students s WHERE s.class_id = $1
          UNION
          SELECT s.parent_id FROM students s WHERE s.class_id = $1 AND s.parent_id IS NOT NULL
        )
      `, [announcement.class_id]);
      targetUsers = result.rows.map(row => row.id);
    } else {
      // Get users by role
      const roleName = roleAudienceMap[announcement.target_audience] || announcement.target_audience;
      const result = await pool.query(`
        SELECT u.id FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = $1 AND u.is_active = true AND u.school_id = $2
      `, [roleName, announcement.school_id]);
      targetUsers = result.rows.map(row => row.id);
    }

    // Create notifications for all target users
    for (const userId of targetUsers) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, notification_type, reference_id, reference_type, school_id) 
         VALUES ($1, $2, $3, 'announcement', $4, 'announcement', $5)`,
        [userId, announcement.title, announcement.content, announcement.id, announcement.school_id || null]
      );
    }
  } catch (error) {
    console.error("Error creating notifications for announcement:", error);
  }
}

// Get Announcements
export const getAnnouncements = async (req, res) => {
  try {
    const { 
      targetAudience, 
      announcementType, 
      classId, 
      isActive = true, 
      page = 1, 
      limit = 10 
    } = req.query;
    const { uid } = req.user;
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const offset = (parsedPage - 1) * parsedLimit;

    // Get user info to filter announcements
    const userResult = await pool.query(
      `SELECT u.id, u.school_id, r.name as role_name FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.uid = $1`,
      [uid]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];

    let query = `
      SELECT a.*, u.name as created_by_name, c.name as class_name, c.section
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.is_active = $1
    `;
    
    const activeBool = isActive === 'true' || isActive === true;
    const queryParams = [activeBool];
    let paramCount = 1;

    const tenantId = req.tenantId || user.school_id || null;
    if (tenantId) {
      paramCount++;
      query += ` AND a.school_id::text = $${paramCount}::text`;
      queryParams.push(tenantId);
    }

    // Filter based on user role and target audience
    if (user.role_name === 'student') {
      // Students see announcements for 'all', 'students', or their specific class
      const studentResult = await pool.query(
        "SELECT class_id FROM students s JOIN users u ON s.user_id = u.id WHERE u.uid = $1",
        [uid]
      );
      
      if (studentResult.rows.length > 0 && studentResult.rows[0].class_id) {
        const studentClassId = studentResult.rows[0].class_id;
        paramCount++;
        query += ` AND (a.target_audience IN ('all', 'students') OR (a.target_audience = 'class_specific' AND a.class_id = $${paramCount}))`;
        queryParams.push(studentClassId);
      } else {
        query += ` AND a.target_audience IN ('all', 'students')`;
      }
    } else if (user.role_name === 'parent') {
      // Parents see announcements for 'all', 'parents', or their child's class
      const childResult = await pool.query(
        "SELECT DISTINCT class_id FROM students WHERE parent_id = $1",
        [user.id]
      );
      
      const childClassIds = childResult.rows.map(row => row.class_id).filter(Boolean);
      if (childClassIds.length > 0) {
        paramCount++;
        query += ` AND (a.target_audience IN ('all', 'parents') OR (a.target_audience = 'class_specific' AND a.class_id = ANY($${paramCount})))`;
        queryParams.push(childClassIds);
      } else {
        query += ` AND a.target_audience IN ('all', 'parents')`;
      }
    } else {
      // Teachers and admins see all announcements or filter by parameters
      if (targetAudience) {
        paramCount++;
        query += ` AND a.target_audience = $${paramCount}`;
        queryParams.push(targetAudience);
      }
    }

    if (announcementType) {
      paramCount++;
      query += ` AND a.announcement_type = $${paramCount}`;
      queryParams.push(announcementType);
    }

    if (classId) {
      paramCount++;
      query += ` AND a.class_id = $${paramCount}`;
      queryParams.push(classId);
    }

    // Only show announcements that are not expired and scheduled
    query += ` AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)`;
    query += ` AND (a.scheduled_at IS NULL OR a.scheduled_at <= CURRENT_TIMESTAMP)`;

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parsedLimit, offset);

    const result = await pool.query(query, queryParams);

    res.json({ success: true, data: result.rows, announcements: result.rows });
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
};

// Update Announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, announcementType, targetAudience, classId, scheduledAt, expiresAt, isActive } = req.body;

    const result = await pool.query(
      `UPDATE announcements 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           announcement_type = COALESCE($3, announcement_type),
           target_audience = COALESCE($4, target_audience),
           class_id = COALESCE($5, class_id),
           scheduled_at = COALESCE($6, scheduled_at),
           expires_at = COALESCE($7, expires_at),
           is_active = COALESCE($8, is_active)
       WHERE id = $9 AND school_id = $10 RETURNING *`,
      [title, content, announcementType, targetAudience, classId, scheduledAt, expiresAt, isActive, id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    res.json({
      message: "Announcement updated successfully",
      announcement: result.rows[0]
    });
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ error: "Failed to update announcement" });
  }
};

// Delete Announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM announcements WHERE id = $1 AND school_id = $2 RETURNING *", [id, req.tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    // Delete related notifications
    await pool.query("DELETE FROM notifications WHERE reference_id = $1 AND reference_type = 'announcement'", [id]);

    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
};

// ==================== MESSAGES/CHAT ====================

// Get possible message recipients
export const getMessageRecipients = async (req, res) => {
  try {
    const { search = '', role, limit = 10 } = req.query;
    const { uid } = req.user;

    const currentUserResult = await pool.query(
      `SELECT u.id, u.school_id, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.uid = $1`,
      [uid]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentUser = currentUserResult.rows[0];
    const tenantId = req.tenantId || currentUser.school_id || null;
    const params = [currentUser.id];
    let paramCount = 1;
    let query = `
      SELECT u.id, u.name, u.email, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = true AND u.id <> $1
    `;

    if (tenantId) {
      paramCount++;
      query += ` AND u.school_id = $${paramCount}`;
      params.push(tenantId);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (role) {
      paramCount++;
      query += ` AND r.name = $${paramCount}`;
      params.push(role);
    }

    paramCount++;
    query += ` ORDER BY u.name ASC LIMIT $${paramCount}`;
    params.push(Math.min(Number(limit) || 50, 100));

    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (error) {
    console.error("Get message recipients error:", error);
    res.status(500).json({ error: "Failed to fetch message recipients" });
  }
};

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, messageText, messageType = 'text', fileUrl, parentMessageId } = req.body;
    const { uid } = req.user;

    if (!receiverId || !messageText) {
      return res.status(400).json({ error: "Receiver ID and message text are required" });
    }

    // Get sender ID
    const userResult = await pool.query("SELECT u.id, u.school_id FROM users u WHERE u.uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const senderId = userResult.rows[0].id;
    const tenantId = req.tenantId || userResult.rows[0].school_id || null;

    if (receiverId === 'common_group') {
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, message_text, message_type, file_url, parent_message_id, school_id, group_type) 
         VALUES ($1, NULL, $2, $3, $4, $5, $6, 'common_group') RETURNING *`,
        [senderId, messageText, messageType, fileUrl, parentMessageId, tenantId]
      );
      return res.status(201).json({
        message: "Message sent to common group successfully",
        messageData: result.rows[0]
      });
    }

    if (isNaN(Number(receiverId))) {
      return res.status(400).json({ error: "Invalid receiver ID format" });
    }

    const receiverResult = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND ($2::text IS NULL OR school_id::text = $2::text) AND is_active = true",
      [receiverId, tenantId]
    );
    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ error: "Receiver not found in your school" });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text, message_type, file_url, parent_message_id, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [senderId, receiverId, messageText, messageType, fileUrl, parentMessageId, tenantId]
    );

    // Create notification for receiver (non-blocking)
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, notification_type, reference_id, reference_type, school_id) 
         VALUES ($1, 'New Message', $2, 'message', $3, 'message', $4)`,
        [receiverId, messageText.substring(0, 100), result.rows[0].id, tenantId]
      );
    } catch (notifErr) {
      console.warn("Non-critical notification insert error:", notifErr.message);
    }

    res.status(201).json({
      message: "Message sent successfully",
      messageData: result.rows[0]
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get Messages (Conversation)
export const getMessages = async (req, res) => {
  try {
    const { otherUserId, page = 1, limit = 50 } = req.query;
    const { uid } = req.user;
    const offset = (Number(page) - 1) * Number(limit);

    if (!otherUserId) {
      return res.status(400).json({ error: "Other user ID is required" });
    }

    // Get current user ID
    const userResult = await pool.query("SELECT u.id, u.school_id FROM users u WHERE u.uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const currentUserId = userResult.rows[0].id;
    const tenantId = req.tenantId || userResult.rows[0].school_id || null;

    if (otherUserId === 'common_group') {
      const result = await pool.query(
        `SELECT m.*, 
           sender.name as sender_name, 
           'Common Group' as receiver_name,
           parent.message_text as parent_message_text,
           (m.sender_id = $4) as is_mine
         FROM messages m
         JOIN users sender ON m.sender_id = sender.id
         LEFT JOIN messages parent ON m.parent_message_id = parent.id
         WHERE m.group_type = 'common_group' AND ($3::text IS NULL OR m.school_id::text = $3::text)
         ORDER BY m.created_at DESC
         LIMIT $1 OFFSET $2`,
        [Number(limit), offset, tenantId, currentUserId]
      );
      return res.json({ messages: result.rows.reverse() });
    }

    if (isNaN(Number(otherUserId))) {
      return res.json({ messages: [] });
    }

    const result = await pool.query(
      `SELECT m.*, 
         sender.name as sender_name, 
         receiver.name as receiver_name,
         parent.message_text as parent_message_text,
         (m.sender_id = $1) as is_mine
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       JOIN users receiver ON m.receiver_id = receiver.id
       LEFT JOIN messages parent ON m.parent_message_id = parent.id
       WHERE ((m.sender_id = $1 AND m.receiver_id = $2) 
          OR (m.sender_id = $2 AND m.receiver_id = $1))
         AND ($5::text IS NULL OR m.school_id::text = $5::text)
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [currentUserId, otherUserId, Number(limit), offset, tenantId]
    );

    // Mark messages as read
    await pool.query(
      "UPDATE messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false",
      [otherUserId, currentUserId]
    );

    res.json({ messages: result.rows.reverse() });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Get Conversations List
export const getConversations = async (req, res) => {
  try {
    const { uid } = req.user;

    // Get current user ID
    const userResult = await pool.query("SELECT u.id, u.school_id FROM users u WHERE u.uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const currentUserId = userResult.rows[0].id;
    const tenantId = req.tenantId || userResult.rows[0].school_id || null;

    const result = await pool.query(
      `WITH conversation_users AS (
         SELECT DISTINCT
           CASE 
             WHEN m.sender_id = $1 THEN m.receiver_id 
             ELSE m.sender_id 
           END as other_user_id,
           CASE 
             WHEN m.sender_id = $1 THEN receiver.name 
             ELSE sender.name 
           END as other_user_name,
           CASE 
             WHEN m.sender_id = $1 THEN receiver.profile_image_url 
             ELSE sender.profile_image_url 
           END as other_user_image,
           MAX(m.created_at) as last_message_time,
           COUNT(CASE WHEN m.receiver_id = $1 AND m.is_read = false THEN 1 END) as unread_count
         FROM messages m
         LEFT JOIN users sender ON m.sender_id = sender.id
         LEFT JOIN users receiver ON m.receiver_id = receiver.id
         WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND ($2::text IS NULL OR m.school_id::text = $2::text)
         GROUP BY 
           CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END,
           CASE WHEN m.sender_id = $1 THEN receiver.name ELSE sender.name END,
           CASE WHEN m.sender_id = $1 THEN receiver.profile_image_url ELSE sender.profile_image_url END
       )
       SELECT 
         cu.other_user_id,
         cu.other_user_name,
         cu.other_user_image,
         cu.last_message_time,
         cu.unread_count,
         (SELECT message_text FROM messages 
          WHERE ((sender_id = $1 AND receiver_id = cu.other_user_id) 
             OR (sender_id = cu.other_user_id AND receiver_id = $1))
            AND ($2::text IS NULL OR school_id::text = $2::text)
          ORDER BY created_at DESC LIMIT 1) as last_message
       FROM conversation_users cu
       WHERE cu.other_user_id IS NOT NULL
       ORDER BY cu.last_message_time DESC`,
      [currentUserId, tenantId]
    );

    let conversations = result.rows;

    const roleResult = await pool.query(
      "SELECT r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1", 
      [currentUserId]
    );
    const userRole = roleResult.rows[0]?.role_name;

    if (userRole === 'admin' || userRole === 'teacher' || userRole === 'super_admin') {
      const commonGroupMsg = await pool.query(
        "SELECT message_text, created_at FROM messages WHERE group_type = 'common_group' AND ($1::text IS NULL OR school_id::text = $1::text) ORDER BY created_at DESC LIMIT 1",
        [tenantId]
      );
      
      const commonGroupConv = {
        other_user_id: 'common_group',
        other_user_name: 'Common Group (All Teachers & Admin)',
        other_user_image: null,
        last_message_time: commonGroupMsg.rows.length > 0 ? commonGroupMsg.rows[0].created_at : new Date(0),
        unread_count: 0,
        last_message: commonGroupMsg.rows.length > 0 ? commonGroupMsg.rows[0].message_text : 'Start chatting with everyone',
        is_group: true
      };

      conversations.unshift(commonGroupConv);
      
      if (userRole === 'admin' || userRole === 'super_admin') {
        const teachers = await pool.query(
          `SELECT u.id, u.name, u.email, u.profile_image_url 
           FROM users u 
           JOIN roles r ON u.role_id = r.id 
           WHERE r.name = 'teacher' AND u.is_active = true AND ($1::text IS NULL OR u.school_id::text = $1::text)`,
          [tenantId]
        );
        
        const existingIds = new Set(conversations.map(c => c.other_user_id));
        for (let teacher of teachers.rows) {
          if (!existingIds.has(teacher.id) && teacher.id !== currentUserId) {
            conversations.push({
              other_user_id: teacher.id,
              other_user_name: teacher.name || teacher.email,
              other_user_image: teacher.profile_image_url,
              last_message_time: new Date(0),
              unread_count: 0,
              last_message: 'No messages yet'
            });
          }
        }
      }
    }
    
    conversations.sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));

    res.json({ conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

// ==================== NOTIFICATIONS ====================

// Get Notifications
export const getNotifications = async (req, res) => {
  try {
    const { isRead, notificationType, page = 1, limit = 20 } = req.query;
    const { uid } = req.user;
    const offset = (page - 1) * limit;

    // Get user ID
    const userResult = await pool.query("SELECT id FROM users WHERE uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;

    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    
    const queryParams = [userId];
    let paramCount = 1;

    if (req.tenantId) {
      paramCount++;
      query += ` AND school_id = $${paramCount}`;
      queryParams.push(req.tenantId);
    }

    if (isRead !== undefined) {
      paramCount++;
      query += ` AND is_read = $${paramCount}`;
      queryParams.push(isRead === 'true');
    }

    if (notificationType) {
      paramCount++;
      query += ` AND notification_type = $${paramCount}`;
      queryParams.push(notificationType);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark Notification as Read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.user;

    // Get user ID
    const userResult = await pool.query("SELECT id FROM users WHERE uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;

    const result = await pool.query(
      "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 AND school_id = $3 RETURNING *",
      [id, userId, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Mark All Notifications as Read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { uid } = req.user;

    // Get user ID
    const userResult = await pool.query("SELECT id FROM users WHERE uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;

    await pool.query("UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false AND school_id = $2", [userId, req.tenantId]);

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// Get Unread Notifications Count
export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const { uid } = req.user;

    // Get user ID
    const userResult = await pool.query("SELECT id FROM users WHERE uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = userResult.rows[0].id;

    const result = await pool.query(
      "SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = $1 AND is_read = false AND school_id = $2",
      [userId, req.tenantId]
    );

    res.json({ unreadCount: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error("Get unread notifications count error:", error);
    res.status(500).json({ error: "Failed to fetch unread notifications count" });
  }
};
