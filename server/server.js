import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./src/routes/index.js";
import errorHandler, {
  notFoundHandler,
} from "./src/middleware/errorHandler.js";
import TokenBlacklist from "./src/models/TokenBlacklist.js";

// Initialize environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// Create Express app
const app = express();

// ======================
//  Middleware Pipeline
// ======================
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
//  Routes
// ======================
app.get("/", (req, res) =>
  res.json({
    status: "running",
    api: `${process.env.API_PREFIX || "/api"}/v1`,
  })
);

app.use(process.env.API_PREFIX || "/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

// ======================
//  Server Startup
// ======================
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server running in ${process.env.NODE_ENV || "development"} mode
  🔗 http://localhost:${PORT}
  ⏱️ ${new Date().toLocaleString()}
  `);

  // Safe route logging attempt
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("\nAvailable Routes:");
      const routeList = getRouteList(app);
      routeList.forEach((route) => console.log(route));
    }
  } catch (err) {
    console.log("\nRoute listing unavailable for this Express version");
  }

  // Set up scheduled tasks
  setupScheduledTasks();
});

// ======================
//  Safe Route Listing
// ======================
function getRouteList(app) {
  try {
    // Modern Express versions
    if (app._router && app._router.stack) {
      return extractRoutes(app._router.stack);
    }

    // Alternative approach for some Express versions
    const routes = [];
    app._router.stack.forEach((layer) => {
      if (layer.route) {
        routes.push(
          `${Object.keys(layer.route.methods).join(",").toUpperCase()} ${
            layer.route.path
          }`
        );
      }
    });
    return routes;
  } catch (err) {
    return ["Route listing not supported"];
  }
}

function extractRoutes(stack, path = "") {
  const routes = [];

  stack.forEach((layer) => {
    if (layer.route) {
      routes.push(
        `${Object.keys(layer.route.methods).join(",").toUpperCase()} ${path}${
          layer.route.path
        }`
      );
    } else if (layer.name === "router") {
      const routerPath =
        path +
        (layer.regexp.source === "^\\/?$"
          ? ""
          : layer.regexp.source
              .replace("^\\", "")
              .replace("\\/?$", "")
              .replace("(?=\\/|$)", ""));
      routes.push(...extractRoutes(layer.handle.stack, routerPath));
    }
  });

  return routes.sort();
}

// Set up scheduled tasks
const setupScheduledTasks = () => {
  // Clean up expired blacklisted tokens every day at midnight
  setInterval(async () => {
    const now = new Date();
    // Only run at approximately midnight
    if (now.getHours() === 0 && now.getMinutes() < 5) {
      console.log("Running scheduled cleanup of token blacklist...");
      const deletedCount = await TokenBlacklist.cleanupExpired();
      console.log(`Cleaned up ${deletedCount} expired tokens from blacklist`);
    }
  }, 1000 * 60 * 5); // Check every 5 minutes
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\nServer shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("\nServer interrupted...");
  server.close(() => process.exit(0));
});
