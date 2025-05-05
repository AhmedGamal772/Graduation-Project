import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

export const validateRequest = (validations) => {
  return async (req, res, next) => {
    try {
      // Handle express-validator array
      if (Array.isArray(validations)) {
        await Promise.all(validations.map((validation) => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ApiError(400, "Validation error", errors.array());
        }
        return next();
      }

      // Handle Joi schema
      if (validations && typeof validations.validate === "function") {
        const { error } = validations.validate(req.body);
        if (error) {
          throw new ApiError(400, "Validation error", error.details);
        }
        return next();
      }

      throw new ApiError(500, "Invalid validation configuration");
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(error.toJSON());
      }
      console.error("Validation error:", error);
      return res
        .status(500)
        .json(new ApiError(500, "Validation error occurred").toJSON());
    }
  };
};
