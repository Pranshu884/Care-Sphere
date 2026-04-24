# CareSphere: Technical Overview

## 1. Project Overview

**What CareSphere Does:**  
CareSphere is a comprehensive healthcare management platform designed to streamline patient and administrative interactions. It provides an integrated ecosystem for secure appointment booking, health record management, automated medication tracking, and initial symptom triage.

**Main Problem It Solves:**  
Fragmentation in patient care and clinic administration. By centralizing health documentation, appointment requests, and medication adherence trackers into a single interface, CareSphere significantly reduces administrative overhead and minimizes the risk of missed treatments or miscommunications.

**Target Users:**  
- **Patients:** Individuals seeking easy access to healthcare scheduling, secure digital storage for medical records, reliable medication reminders, and immediate symptom triage guidance.  
- **Administrators / Clinic Staff:** Personnel requiring a unified, efficient dashboard to manage appointment queues and oversee general operations.

**Current Project Status:**  
The project is currently in the demo/pre-production phase. Core functionalities are implemented, stable, and fully operational, serving effectively as a mature Minimum Viable Product (MVP) to demonstrate end-to-end system capabilities.

**Major Completed Modules:**  
- User Authentication & Role-Based Authorization
- Patient Dashboard & Analytics Component
- Appointment Management System
- Health Record & File Management
- Scheduled Medication Reminders
- Intelligent Symptom Triage Engine

**Features Currently Working in Production/Demo:**  
- Secure Email OTP Authentication
- End-to-end appointment scheduling (Request -> Admin Approval)
- Rule-based symptom checking and severity triage
- Cloud-based upload and timeline preview of health reports
- Automated medication notification emails
- Centralized admin dashboard for overarching system management

---

## 2. Tech Stack

CareSphere is built on a robust, modern MERN architecture, utilizing the following specific technologies:

**Frontend**  
- **Framework:** React + Vite (for optimized bundling and fast HMR)  

**Backend**  
- **Runtime:** Node.js  
- **Framework:** Express.js (for RESTful API development)  

**Database**  
- **Primary Datastore:** MongoDB (NoSQL)  

**Authentication & Security**  
- **Token Management:** JSON Web Tokens (JWT) for secure, stateless session handling.  
- **Verification:** Email-based OTP authentication.  
- **Access Control:** Strict Role-Based Access Control (RBAC), identifying users primarily as `Patient` or `Admin`.  

**Services & Integrations**  
- **File Storage:** Cloudinary (utilized for secure health report uploads and optimized asset delivery).  
- **Email Services:** Gmail SMTP integrated via Nodemailer (handles all transactional emails, including OTPs—*Resend is not used*).  
- **Scheduling/Automation:** `node-cron` integrated locally on the server for precise execution of scheduled medicine reminders.  

**Deployment & Development Tools**  
- **Version Control:** Git & GitHub  
- **Package Management:** npm  

---

## 3. Technical Architecture

**System Architecture:**  
CareSphere operates on a decoupled client-server model. The React frontend communicates with the Express backend via REST APIs. The backend securely interfaces with MongoDB to persist user, appointment, and medical data, while delegating intensive or specialized tasks to third-party services (Cloudinary for BLOB storage, Gmail SMTP for outbound communication).

**API Flow:**  
1. The client dispatches HTTP requests (GET/POST/PUT/DELETE) to Express routes.  
2. Requests pass through middleware (e.g., authentication verification, input validation).  
3. The controller executes business logic, querying MongoDB or interfacing with external APIs.  
4. The controller formats the response and returns an standard JSON payload to the client.

**Auth Flow:**  
1. User requests login/registration using their email address.  
2. The backend generates a numeric OTP, saves the encrypted hash locally (with strict expiry), and dispatches the OTP via Nodemailer.  
3. User submits the OTP.  
4. The backend verifies the hash, provisions the user (if new), and issues a signed JWT containing their Role and ID.  
5. The client securely stores the JWT and attaches it as a Bearer token in subsequent API headers.

**File Upload Flow:**  
1. Patient selects a health report (image or PDF) on the frontend.  
2. The file is transmitted via `multipart/form-data` to the backend.  
3. The backend buffers the file in memory and streams it directly to Cloudinary.  
4. Cloudinary returns a secure URL.  
5. The backend embeds this URL into a new `Report` document in MongoDB, linked to the user's ID.

**Medicine Reminder Flow:**  
1. Patient configures a medication schedule on their dashboard (dosage, specific times/days).  
2. The backend persists the schedule configuration in MongoDB.  
3. A synchronized `node-cron` job runs at set intervals on the Node.js server.  
4. The cron job queries the database for schedules matching the current timestamp that require notification.  
5. Nodemailer dispatches the reminder emails.  
6. The system updates a `lastNotifiedAt` timestamp on the record to prevent duplicate firing.

**Appointment Booking Flow:**  
1. Patient submits a request for an appointment with a preferred time and department.  
2. The backend creates an Appointment record in a `Pending` state.  
3. The System Administrator logs into the central dashboard and reviews the pending appointment queue.  
4. The Admin explicitly approves or rejects the appointment.  
5. The Appointment state is finalized in the database, and the patient's dashboard is updated synchronously.

**Symptom Checker Logic Flow:**  
1. Patient inputs their observed symptoms via the frontend interface.  
2. The input is processed by a deterministic, rule-based triage engine.  
3. The engine evaluates symptoms against encoded clinical flags and rulesets.  
4. The system categorizes the condition severity (e.g., Emergency, Urgent, Moderate, Low).  
5. The client displays actionable triage guidance based closely on the assigned severity rather than offering a direct medical diagnosis.

---

## 4. Current Features

**Email OTP Authentication:**  
A highly secure, passwordless authentication mechanism bridging the gap between security and user convenience. It relies transparently on email verification via Nodemailer and Gmail SMTP, utilizing zero phone OTP configurations.

**Doctor Appointment Booking:**  
Allows patients to request consultations intuitively. Instead of managing individual doctor accounts, the platform centralizes requests into an administrative queue for processing. 

**Admin Appointment Approval/Rejection:**  
System administrators possess dedicated RBAC privileges overseeing operations. Through the Admin Dashboard, staff evaluate pending appointment requests against clinical availability and manually approve or reject them, ensuring organized and unified schedule management directly without individual provider intervention.

**Symptom Checker (AI-Assisted Triage):**  
An intelligent, rule-based triage assistant. It analyzes patient-reported symptoms to provide immediate, urgency-coded guidance (e.g., advising a visit to the nearest ER vs. booking a routine clinical visit). It is strictly architected for triage and workflow routing.

**Health Report Upload + Preview + Timeline:**  
A centralized digital repository for medical records. Patients securely upload documents (facilitated by Cloudinary integration). The UI provides in-browser preview capabilities and organizes historical records in a chronological timeline, enabling patients and admins to track health progression effectively.

**Medicine Reminder with Scheduled Email Alerts:**  
A comprehensive adherence tracking system. Patients establish structured medication schedules, and the backend `node-cron` service autonomously monitors these rules, reliably distributing precise email notifications at the mandated intervals.

**Admin Dashboard Management:**  
A secure portal reserved for clinic operators. It acts as the central nervous system for the platform, enabling overarching management of user databases, health reports, and the complete appointment lifecycle without requiring complex, multi-tenant provider routing.

---

## 5. Limitations + Future Improvements

**Current Constraints & Demo Limitations:**  
- **Centralized Admin Workflow:** The current iteration delegates all operational approvals to a central Admin role. It does not actively support multi-tenant login portals for individual doctors (e.g., individual doctor accounts scaling up to roster sets like 70+ personnel are entirely beyond the MVP constraint block).  
- **Stateless Cron Execution:** The `node-cron` implementation runs locally in the Node process. In a horizontally scaled production instance across multiple servers, this could theoretically lead to redundant email dispatches without an external locking mechanism.  
- **Email Dispatch Limits:** Utilization of standard Gmail SMTP imposes hard daily sending limits. This meets current MVP/demo demands but acts as a bottleneck for mass enterprise scaling.

**Production Improvements Needed Later:**  
- **Distributed Task Queues:** Migrate the local `node-cron` approach to a distributed message queue (e.g., BullMQ + Redis) or a cloud-native scheduler like AWS EventBridge to handle thousands of concurrent reminder evaluations smoothly.  
- **Dedicated Provider Portals:** Expand the RBAC model to introduce a customized 'Doctor' role, granting individual providers isolated access to manage their specific calendars and patient encounter notes.  
- **Enterprise Email Solutions:** Transition from the Nodemailer/Gmail MVP implementation to a dedicated transactional email provider (e.g., SendGrid, AWS SES) for greater deliverability monitoring and unrestricted scalability.
