import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import providersRouter from "./providers";
import customersRouter from "./customers";
import rechargesRouter from "./recharges";
import dashboardRouter from "./dashboard";
import smsRouter from "./sms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(providersRouter);
router.use(customersRouter);
router.use(rechargesRouter);
router.use(dashboardRouter);
router.use(smsRouter);

export default router;
