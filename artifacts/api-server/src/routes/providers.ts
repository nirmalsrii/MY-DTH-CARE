import { Router, type IRouter } from "express";

const router: IRouter = Router();

const PROVIDERS = [
  { id: "tata_play", name: "Tata Play", logoUrl: null, defaultValidityDays: 30 },
  { id: "airtel", name: "Airtel Digital TV", logoUrl: null, defaultValidityDays: 30 },
  { id: "dish_tv", name: "Dish TV", logoUrl: null, defaultValidityDays: 30 },
  { id: "sun_direct", name: "Sun Direct", logoUrl: null, defaultValidityDays: 30 },
  { id: "d2h", name: "d2h", logoUrl: null, defaultValidityDays: 30 },
  { id: "zing", name: "Zing Digital", logoUrl: null, defaultValidityDays: 28 },
  { id: "dd_freedish", name: "DD Free Dish", logoUrl: null, defaultValidityDays: 365 },
];

router.get("/providers", async (_req, res): Promise<void> => {
  res.json(PROVIDERS);
});

export default router;
