# Hackathon Platform Backend Specification

## 🏗 Architecture

* Layered Monolith
* Structure:

  * controllers/
  * services/
  * repositories/
  * db/
  * modules/

Tech stack:

* Fastify
* PostgreSQL
* Drizzle ORM
* Redis
* Swagger
* Zod

---

## 🔐 Authentication

### User

* id (UUID)
* email
* username
* full_name
* password_hash
* avatar_url
* description
* created_at
* updated_at

### UserTokens

* user_id
* token
* type (EMAIL_CONFIRM, PASSWORD_RESET, CHANGE_EMAIL, TWO_FACTOR, GITHUB)
* expires_at
* used

### UserSocials

* user_id
* type_social (discord, telegram, viber, github)
* url

---

## 🎭 Roles & Permissions

### Role

* id
* name (admin, judge, mentor, participant)

### UserRoles

* user_id
* role_id
* hackathon_id (nullable)

---

## 🎓 Student Context

### Specialties

* code
* name

### StudentGroup

* name
* specialties_id

### StudentInformation

* group_id
* user_id

---

## 🚀 Hackathon Core

### Hackathon

* title
* subtitle
* description
* location
* online
* start_date
* end_date
* min_team_size
* max_team_size
* banner
* rules_url
* contact_email

### Stage

* hackathon_id
* name
* order_index
* start_date
* end_date

### Track

* name
* description
* hackathon_id

---

## 🏆 Awards

### Awards

* hackathon_id
* certificate
* name
* description
* place

### PhysicalGifts

* award_id
* name
* description
* image

---

## 👥 Teams

### Team

* name
* description
* logo
* track_id

### TeamApproval

* team_id
* status (PENDING, APPROVED, REJECTED, DISQUALIFIED)
* approved_by
* approved_at
* comment

### TeamMember

* team_id
* user_id
* role (participant, captain)

### TeamInvite

* team_id
* token
* created_by
* expires_at
* max_uses
* uses_count
* active

---

## 📦 Projects

### Project

* team_id
* stage_id
* status (DRAFT, SUBMITTED, REVIEWED, APPROVED, REJECTED)
* submitted_at
* reviewed_at
* comment

### ProjectResourceType

* name
* description

### ProjectResource

* project_id
* project_type_id
* url
* description

---

## 🧠 Mentorship

### MentorAvailability

* mentor_id
* track_id (nullable)
* start_datetime
* end_datetime
* status (available, blocked)

### MentorSlot

* mentor_availability_id
* team_id
* start_datetime
* duration_minute
* status (booked, completed, cancelled)
* meeting_link

---

## ⚖️ Judging

### Criteria

* track_id
* name
* weight
* max_score

### Score

* judge_id
* project_id
* criteria_id
* comment
* assessment

### JudgeConflict

* judge_id
* team_id
* reason

---

## ⚡ Business Logic

### Mentor Booking

* Redis lock required
* Prevent overlapping slots
* TTL protection

### Scoring

* Normalize scores
* Detect judge bias
* Ignore conflicts

---

## 📘 API

* REST API
* JWT Auth
* Swagger required

---

## 🐳 Deployment

* Docker
* Env config
* PostgreSQL + Redis containers
