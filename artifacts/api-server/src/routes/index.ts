import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import menuItemsRouter from "./menuItems";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import favoritesRouter from "./favorites";
import reviewsRouter from "./reviews";
import couponsRouter from "./coupons";
import offersRouter from "./offers";
import adminRouter from "./admin";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(menuItemsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(favoritesRouter);
router.use(reviewsRouter);
router.use(couponsRouter);
router.use(offersRouter);
router.use(adminRouter);
router.use(uploadsRouter);

export default router;
