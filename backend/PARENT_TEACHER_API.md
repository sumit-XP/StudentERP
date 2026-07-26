# Parent-Teacher Interaction API Documentation

## Base URL
```
http://localhost:5000/api/parent-teacher
```

---

## 🤝 Parent-Teacher Meetings

### 1. Schedule Meeting
**POST** `/meetings`

**Access:** Admin, Teacher, Parent

**Request Body:**
```json
{
  "studentId": 1,
  "teacherId": 2,
  "scheduledAt": "2025-12-10T10:00:00",
  "topic": "Discuss student academic progress"
}
```

**Response (201):**
```json
{
  "message": "Meeting scheduled successfully",
  "meeting": {
    "id": 1,
    "class_id": 5,
    "student_id": 1,
    "teacher_id": 2,
    "scheduled_at": "2025-12-10T10:00:00",
    "topic": "Discuss student academic progress",
    "notes": null,
    "status": "scheduled",
    "created_at": "2025-12-05T22:50:00"
  }
}
```

---

### 2. Get Meetings
**GET** `/meetings`

**Access:** All authenticated users

**Query Parameters:**
- `studentId` (optional) - Filter by student ID
- `teacherId` (optional) - Filter by teacher ID
- `status` (optional) - Filter by status (scheduled, completed, cancelled)
- `startDate` (optional) - Filter meetings from this date
- `endDate` (optional) - Filter meetings until this date

**Example:**
```
GET /meetings?studentId=1&status=scheduled
```

**Response (200):**
```json
{
  "meetings": [
    {
      "id": 1,
      "class_id": 5,
      "student_id": 1,
      "teacher_id": 2,
      "scheduled_at": "2025-12-10T10:00:00",
      "topic": "Discuss student academic progress",
      "notes": null,
      "status": "scheduled",
      "created_at": "2025-12-05T22:50:00",
      "student_number": "STD2025001",
      "student_name": "John Doe",
      "teacher_name": "Ms. Smith",
      "class_name": "Grade 5",
      "section": "A"
    }
  ],
  "count": 1
}
```

---

### 3. Get Meeting by ID
**GET** `/meetings/:id`

**Access:** All authenticated users

**Response (200):**
```json
{
  "meeting": {
    "id": 1,
    "class_id": 5,
    "student_id": 1,
    "teacher_id": 2,
    "scheduled_at": "2025-12-10T10:00:00",
    "topic": "Discuss student academic progress",
    "notes": null,
    "status": "scheduled",
    "created_at": "2025-12-05T22:50:00",
    "student_number": "STD2025001",
    "student_name": "John Doe",
    "student_email": "john.parent@example.com",
    "teacher_name": "Ms. Smith",
    "teacher_email": "smith@school.com",
    "class_name": "Grade 5",
    "section": "A"
  }
}
```

---

### 4. Update Meeting
**PUT** `/meetings/:id`

**Access:** Admin, Teacher, Parent

**Request Body:**
```json
{
  "scheduledAt": "2025-12-11T14:00:00",
  "topic": "Updated topic - Midterm exam discussion",
  "notes": "Please bring student's report card"
}
```

**Response (200):**
```json
{
  "message": "Meeting updated successfully",
  "meeting": {
    "id": 1,
    "scheduled_at": "2025-12-11T14:00:00",
    "topic": "Updated topic - Midterm exam discussion",
    "notes": "Please bring student's report card",
    "status": "scheduled"
  }
}
```

---

### 5. Update Meeting Status
**PUT** `/meetings/:id/status`

**Access:** Admin, Teacher

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Meeting completed. Discussed student's progress and homework habits."
}
```

**Valid Status Values:**
- `scheduled`
- `completed`
- `cancelled`

**Response (200):**
```json
{
  "message": "Meeting status updated successfully",
  "meeting": {
    "id": 1,
    "status": "completed",
    "notes": "Meeting completed. Discussed student's progress and homework habits."
  }
}
```

---

### 6. Cancel Meeting
**DELETE** `/meetings/:id`

**Access:** Admin, Teacher, Parent

**Response (200):**
```json
{
  "message": "Meeting cancelled successfully",
  "meeting": {
    "id": 1,
    "status": "cancelled"
  }
}
```

---

## 💬 Parent Feedback / Complaints / Suggestions

### 7. Submit Feedback
**POST** `/feedback`

**Access:** Parent only

**Request Body:**
```json
{
  "studentId": 1,
  "feedbackType": "complaint",
  "subject": "Bus service running late",
  "message": "The school bus has been arriving 15-20 minutes late for the past week. This is causing issues with my child's attendance."
}
```

**Feedback Types:**
- `feedback` - General feedback
- `complaint` - Issue or complaint
- `suggestion` - Improvement suggestion

**Response (201):**
```json
{
  "message": "Feedback submitted successfully",
  "feedback": {
    "id": 1,
    "student_id": 1,
    "parent_id": 3,
    "feedback_type": "complaint",
    "subject": "Bus service running late",
    "message": "The school bus has been arriving 15-20 minutes late for the past week.",
    "status": "open",
    "created_at": "2025-12-05T22:50:00",
    "resolved_at": null
  }
}
```

---

### 8. Get Feedback
**GET** `/feedback`

**Access:** All authenticated users (filtered by role)

**Query Parameters:**
- `studentId` (optional) - Filter by student ID
- `feedbackType` (optional) - Filter by type (feedback, complaint, suggestion)
- `status` (optional) - Filter by status (open, resolved, dismissed)

**Example:**
```
GET /feedback?status=open&feedbackType=complaint
```

**Response (200):**
```json
{
  "feedback": [
    {
      "id": 1,
      "student_id": 1,
      "parent_id": 3,
      "feedback_type": "complaint",
      "subject": "Bus service running late",
      "message": "The school bus has been arriving 15-20 minutes late for the past week.",
      "status": "open",
      "created_at": "2025-12-05T22:50:00",
      "resolved_at": null,
      "student_number": "STD2025001",
      "student_name": "John Doe",
      "parent_name": "Mr. Doe",
      "parent_email": "parent@example.com",
      "class_name": "Grade 5",
      "section": "A"
    }
  ],
  "count": 1
}
```

---

### 9. Get Feedback by ID
**GET** `/feedback/:id`

**Access:** All authenticated users

**Response (200):**
```json
{
  "feedback": {
    "id": 1,
    "student_id": 1,
    "parent_id": 3,
    "feedback_type": "complaint",
    "subject": "Bus service running late",
    "message": "The school bus has been arriving 15-20 minutes late for the past week.",
    "status": "open",
    "created_at": "2025-12-05T22:50:00",
    "resolved_at": null,
    "student_number": "STD2025001",
    "student_name": "John Doe",
    "parent_name": "Mr. Doe",
    "parent_email": "parent@example.com",
    "class_name": "Grade 5",
    "section": "A"
  }
}
```

---

### 10. Update Feedback Status
**PUT** `/feedback/:id/status`

**Access:** Admin only

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Valid Status Values:**
- `open`
- `resolved`
- `dismissed`

**Response (200):**
```json
{
  "message": "Feedback status updated successfully",
  "feedback": {
    "id": 1,
    "status": "resolved",
    "resolved_at": "2025-12-06T10:30:00"
  }
}
```

---

### 11. Resolve Feedback
**PUT** `/feedback/:id/resolve`

**Access:** Admin, Teacher

**Request Body:**
```json
{
  "resolutionNotes": "Bus route has been adjusted. Driver has been instructed to leave 10 minutes earlier to ensure on-time arrival."
}
```

**Response (200):**
```json
{
  "message": "Feedback resolved successfully",
  "feedback": {
    "id": 1,
    "status": "resolved",
    "message": "The school bus has been arriving 15-20 minutes late for the past week.\n\nResolution: Bus route has been adjusted. Driver has been instructed to leave 10 minutes earlier to ensure on-time arrival.",
    "resolved_at": "2025-12-06T10:30:00"
  }
}
```

---

## 🔐 Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 🛡️ Role-Based Access Control

| Endpoint | Admin | Teacher | Parent | Student |
|----------|-------|---------|--------|---------|
| Schedule Meeting | ✅ | ✅ | ✅ | ❌ |
| Get Meetings | ✅ | ✅ | ✅ | ✅ |
| Get Meeting by ID | ✅ | ✅ | ✅ | ✅ |
| Update Meeting | ✅ | ✅ | ✅ | ❌ |
| Update Meeting Status | ✅ | ✅ | ❌ | ❌ |
| Cancel Meeting | ✅ | ✅ | ✅ | ❌ |
| Submit Feedback | ❌ | ❌ | ✅ | ❌ |
| Get Feedback | ✅ | ✅ | ✅* | ❌ |
| Get Feedback by ID | ✅ | ✅ | ✅* | ❌ |
| Update Feedback Status | ✅ | ❌ | ❌ | ❌ |
| Resolve Feedback | ✅ | ✅ | ❌ | ❌ |

*Parents can only see feedback they submitted

---

## 📌 Notes

- **Auto-filtering by role:** Parents automatically see only their own meetings and feedback
- **Teachers** see meetings where they are the assigned teacher
- **Admins** have full access to all meetings and feedback
- **Meeting status** is automatically set to "scheduled" when created
- **Feedback status** is automatically set to "open" when submitted
- **Resolution tracking:** When resolving feedback, resolution notes are appended to the original message

---

## 🧪 Testing Examples

### Test 1: Schedule a Meeting (as Parent)
```bash
curl -X POST http://localhost:5000/api/parent-teacher/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <parent_token>" \
  -d '{
    "studentId": 1,
    "teacherId": 2,
    "scheduledAt": "2025-12-15T10:00:00",
    "topic": "Discuss mathematics performance"
  }'
```

### Test 2: Get All Open Complaints (as Admin)
```bash
curl -X GET "http://localhost:5000/api/parent-teacher/feedback?status=open&feedbackType=complaint" \
  -H "Authorization: Bearer <admin_token>"
```

### Test 3: Resolve Feedback (as Teacher)
```bash
curl -X PUT http://localhost:5000/api/parent-teacher/feedback/1/resolve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{
    "resolutionNotes": "Issue has been addressed and corrected"
  }'
```

### Test 4: Complete Meeting (as Teacher)
```bash
curl -X PUT http://localhost:5000/api/parent-teacher/meetings/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <teacher_token>" \
  -d '{
    "status": "completed",
    "notes": "Productive discussion about student progress"
  }'
```
