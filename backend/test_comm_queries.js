import pool from './src/config/db.js';

async function test() {
  try {
    console.log("=== Testing messages table schema ===");
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'messages'
    `);
    console.log("Messages columns:", cols.rows);

    console.log("=== Testing getConversations SQL ===");
    const currentUserId = 4;
    const tenantId = 'a059e7af-62c5-4190-920e-d2272cc1737d';

    try {
      const convs = await pool.query(
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
           WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND ($2::uuid IS NULL OR m.school_id = $2::uuid)
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
              AND ($2::uuid IS NULL OR school_id = $2::uuid)
            ORDER BY created_at DESC LIMIT 1) as last_message
         FROM conversation_users cu
         WHERE cu.other_user_id IS NOT NULL
         ORDER BY cu.last_message_time DESC`,
        [currentUserId, tenantId]
      );
      console.log("getConversations query SUCCESS, rows:", convs.rows.length);
    } catch (err) {
      console.error("getConversations SQL ERROR:", err.message);
    }

    try {
      console.log("=== Testing common_group SQL ===");
      const commonGroupMsg = await pool.query(
        "SELECT message_text, created_at FROM messages WHERE group_type = 'common_group' AND ($1::uuid IS NULL OR school_id = $1::uuid) ORDER BY created_at DESC LIMIT 1",
        [tenantId]
      );
      console.log("common_group SQL SUCCESS");
    } catch (err) {
      console.error("common_group SQL ERROR:", err.message);
    }

    try {
      console.log("=== Testing original getConversations integer cast SQL ===");
      const origConvs = await pool.query(
        "SELECT message_text, created_at FROM messages WHERE group_type = 'common_group' AND ($1::integer IS NULL OR school_id = $1::integer) ORDER BY created_at DESC LIMIT 1",
        [tenantId]
      );
      console.log("orig integer cast SUCCESS");
    } catch (err) {
      console.error("orig integer cast ERROR:", err.message);
    }

  } catch (e) {
    console.error("GENERAL ERROR:", e.message);
  } finally {
    await pool.end();
  }
}

test();
