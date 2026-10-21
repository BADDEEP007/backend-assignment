import express from 'express';
import helmet from 'helmet';
import user_route from './routes/user_routes.js'
import doctor from './routes/doctor_routes.js'
import booking from './routes/bookingroutes.js'
import doctorApplicationRoutes from './routes/doctorapplication.js'
import admin from './routes/adminroute.js'
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import fs from "node:fs";
import { apiLimiter,authLimiter } from './middleware/rate_limiter.js';
const app = express()


const openapiDocument = YAML.parse(
  fs.readFileSync("./openapi.yaml", "utf8")
);

app.use(express.json())
app.use(helmet())
app.use("/users",authLimiter, user_route)
app.use("/doctor",apiLimiter, doctor)
app.use("/booking",apiLimiter, booking)
app.use("/doctor-applications",apiLimiter, doctorApplicationRoutes);
app.use("/admin",apiLimiter, admin);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiDocument)
);



app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;

  if (status === 500) {
    console.error(err);
  }

  return res.status(status).json({
    success: false,
    message: status === 500
      ? "Internal server error"
      : err.message
  });
});

export  default app