// Application constants
export const userRoles = ["student", "instructor", "admin"];

export const courseTypes = [
  "General Education",
  "Major-Specific",
  "Elective",
  "Faculty-Specific",
];

export const allowedFileTypes = ["pdf", "docx", "pptx", "jpg", "jpeg", "png"];

export const maxFileSizeMB = 10; // 10MB default

export const paginationDefaults = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

export default {
  userRoles,
  courseTypes,
  allowedFileTypes,
  maxFileSizeMB,
  paginationDefaults,
};
