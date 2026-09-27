// Demo tasks — realistic Indian campus/placement mock data
export const demoTasks = [
  {
    task_id: "task-001",
    title: "Register for ABC Technologies Campus Drive",
    category: "placement",
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    eligibility: {
      branches: ["CSE", "IT", "ECE"],
      graduation_year: 2026,
      min_cgpa: 7.0,
    },
    requirements: [
      "Upload updated resume (PDF)",
      "Complete online registration form",
      "Carry college ID to venue",
    ],
    priority: "high",
    status: "pending",
    justification:
      "Registration closes today at 6:00 PM and the opportunity matches your profile. ABC Technologies is offering competitive packages for CSE 2026 graduates.",
    source_ref: { document_id: "doc-001", page: 1, bbox: [120, 200, 580, 320] },
    confidence: "high",
  },
  {
    task_id: "task-002",
    title: "Submit National Merit Scholarship Application",
    category: "scholarship",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
    eligibility: {
      branches: ["All"],
      graduation_year: null,
      min_cgpa: 8.5,
    },
    requirements: [
      "Income certificate from tehsildar",
      "Previous semester marksheets",
      "Bank account details",
      "Passport size photograph",
    ],
    priority: "high",
    status: "pending",
    justification:
      "Application deadline is in 2 days. Your CGPA of 8.7 qualifies you. This scholarship covers 80% of tuition fees.",
    source_ref: { document_id: "doc-002", page: 2, bbox: [80, 150, 520, 280] },
    confidence: "high",
  },
  {
    task_id: "task-003",
    title: "Register for Infosys InfyTQ Certification",
    category: "placement",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days
    eligibility: {
      branches: ["CSE", "IT", "ECE", "EEE"],
      graduation_year: 2026,
      min_cgpa: 6.5,
    },
    requirements: [
      "Register on InfyTQ portal",
      "Complete Python fundamentals module",
      "Schedule certification exam",
    ],
    priority: "medium",
    status: "pending",
    justification:
      "InfyTQ certification significantly improves shortlisting probability for Infosys. Registration window closes in 5 days.",
    source_ref: { document_id: "doc-001", page: 3, bbox: [100, 400, 600, 520] },
    confidence: "high",
  },
  {
    task_id: "task-004",
    title: "Submit Hostel Room Change Request",
    category: "hostel",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    eligibility: {
      branches: ["All"],
      graduation_year: null,
      min_cgpa: null,
    },
    requirements: [
      "Fill room change form at hostel office",
      "No dues certificate from current block",
      "Warden approval signature",
    ],
    priority: "medium",
    status: "in_progress",
    justification:
      "Room change window opens only twice per semester. Current window closes in 3 days. Missing it means waiting until next semester.",
    source_ref: { document_id: "doc-003", page: 1, bbox: [60, 100, 450, 200] },
    confidence: "medium",
  },
  {
    task_id: "task-005",
    title: "Register for Microsoft Engage Mentorship Program",
    category: "placement",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    eligibility: {
      branches: ["CSE", "IT"],
      graduation_year: 2026,
      min_cgpa: 7.5,
    },
    requirements: [
      "Apply via Microsoft Careers portal",
      "Submit 200-word statement of purpose",
      "Upload resume with GitHub profile",
    ],
    priority: "medium",
    status: "pending",
    justification:
      "Microsoft Engage offers pre-placement offers to top performers. Your profile is a strong match. Deadline is 7 days away.",
    source_ref: { document_id: "doc-001", page: 4, bbox: [80, 250, 540, 380] },
    confidence: "high",
  },
  {
    task_id: "task-006",
    title: "End Semester Examination Form Submission",
    category: "exam",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
    eligibility: {
      branches: ["All"],
      graduation_year: null,
      min_cgpa: null,
    },
    requirements: [
      "Fill examination form on student portal",
      "Pay examination fee",
      "Verify subject list with department",
    ],
    priority: "low",
    status: "pending",
    justification:
      "Semester examination form deadline is in 10 days. Late submission incurs a penalty fee of ₹500.",
    source_ref: { document_id: "doc-004", page: 1, bbox: [40, 60, 480, 180] },
    confidence: "high",
  },
  {
    task_id: "task-007",
    title: "Attend Deloitte Pre-Placement Talk",
    category: "placement",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    eligibility: {
      branches: ["CSE", "IT", "ECE", "Mech", "Civil"],
      graduation_year: 2026,
      min_cgpa: 6.0,
    },
    requirements: [
      "Register attendance on placement portal",
      "Bring college ID",
      "Dress code: formal",
    ],
    priority: "high",
    status: "pending",
    justification:
      "Attendance at PPT is mandatory for Deloitte shortlisting. The session is tomorrow at 10:00 AM in Auditorium A.",
    source_ref: { document_id: "doc-001", page: 2, bbox: [120, 300, 560, 420] },
    confidence: "high",
  },
  {
    task_id: "task-008",
    title: "Submit Accenture TechVista Hackathon Entry",
    category: "event",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    eligibility: {
      branches: ["CSE", "IT", "ECE"],
      graduation_year: 2026,
      min_cgpa: 6.5,
    },
    requirements: [
      "Form team of 2–4 members",
      "Submit project abstract (500 words)",
      "Register on Accenture portal",
    ],
    priority: "low",
    status: "pending",
    justification:
      "Top teams get fast-tracked to Accenture campus interviews. Good opportunity if you have project work to showcase.",
    source_ref: { document_id: "doc-001", page: 5, bbox: [100, 180, 550, 300] },
    confidence: "medium",
  },
  {
    task_id: "task-009",
    title: "Collect Verified Marksheet from Exam Section",
    category: "exam",
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    eligibility: {
      branches: ["All"],
      graduation_year: null,
      min_cgpa: null,
    },
    requirements: ["Bring fee receipt", "Application form from exam section"],
    priority: "low",
    status: "completed",
    justification:
      "Verified marksheets are required for placement registration and scholarship applications.",
    source_ref: { document_id: "doc-004", page: 2, bbox: [60, 120, 420, 220] },
    confidence: "high",
  },
  {
    task_id: "task-010",
    title: "Complete CGPA Improvement Application (KT Exam)",
    category: "exam",
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    eligibility: {
      branches: ["All"],
      graduation_year: null,
      min_cgpa: null,
    },
    requirements: ["Fill form at exam section", "Pay ₹200 application fee"],
    priority: "medium",
    status: "pending",
    justification:
      "If you have backlog papers, this is your window to clear them before placements begin.",
    source_ref: { document_id: "doc-004", page: 3, bbox: [80, 300, 500, 400] },
    confidence: "medium",
  },
];

export const demoUser = {
  id: "user-demo-001",
  name: "Alex Sharma",
  email: "alex.sharma@college.edu",
  college: "Visvesvaraya National Institute of Technology",
  branch: "CSE",
  graduation_year: 2026,
  cgpa: 8.7,
  preferred_language: "en",
};
