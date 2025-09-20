const { body, param, query } = require("express-validator");

exports.createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 255 })
    .withMessage("Title must not exceed 255 characters"),
  body("description").optional().isString(),
  body("due_date")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid ISO8601 date")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Due date cannot be in the past");
      }
      return true;
    }),
  body("assigned_to")
    .optional()
    .isInt()
    .withMessage("Assigned user ID must be an integer"),
];

exports.updateTaskValidator = [
  param("id").isInt().withMessage("Task ID must be an integer"),
  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Status must be one of: todo, in-progress, done"),
  body("due_date")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid ISO8601 date"),
];

exports.taskQueryValidator = [
  query("status")
    .optional()
    .isIn(["todo", "in-progress", "done"])
    .withMessage("Invalid status filter"),
  query("due_before")
    .optional()
    .isISO8601()
    .withMessage("due_before must be a valid date"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a positive integer"),
];
