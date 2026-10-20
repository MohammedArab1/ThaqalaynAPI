import { Router, type Request, type Response } from "express";
import path from "path";
import v1Router from "./v1/hadith.js";
import v2Router from "./v2/hadith.js";
import v3Router from "./v3/hadith.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const filePath = path.join(
    process.cwd(),
    "API",
    "src",
    "api",
    "rest",
    "public",
    "index.html",
  );

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending index.html:", err);
      res.status(500).send("Internal server error");
    }
  });
});

router.use("/api/v2", v2Router);
router.use("/api/v3", v3Router);
router.use("/api", v1Router);

// Errors from these routes propagate out of this router to the app-level
// errorHandler in app.ts, which is the single renderer for the whole app.

export default router;
