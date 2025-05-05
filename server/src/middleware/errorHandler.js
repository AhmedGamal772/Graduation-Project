export default (err, req, res, next) => {
  // Default error structure
  const error = {
    code: err.code || 'SERVER_ERROR',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      errors: err.details 
        ? err.details.map(e => ({
            field: e.context.key,
            message: e.message
          }))
        : err.errors
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      code: 'DUPLICATE_ENTRY',
      message: 'Resource already exists'
    });
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      code: 'MISSING_TABLE',
      message: 'Database table missing - run setup script'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  // Database errors
  if (err.sql) {
    console.error('SQL Error:', err.sqlMessage);
    return res.status(500).json({
      code: 'DATABASE_ERROR',
      message: 'Database operation failed'
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      code: 'FILE_TOO_LARGE',
      message: `File size exceeds ${process.env.MAX_FILE_SIZE_MB || 10}MB limit`
    });
  }

  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(415).json({
      code: 'INVALID_FILE_TYPE',
      message: `Only ${process.env.ALLOWED_FILE_TYPES || 'pdf,docx,pptx,jpg,png'} files are allowed`
    });
  }

  // Default 500 error
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json(error);
};

// 404 Handler (for undefined routes)
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  });
};