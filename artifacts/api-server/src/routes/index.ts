import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import profilesRouter from "./profiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jobsRouter);
router.use(profilesRouter);

export default router;
