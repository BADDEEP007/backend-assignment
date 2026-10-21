import express from 'express';
import helmet from 'helmet';
import user_route from './routes/user_routes.js'
import doctor from './routes/doctor_routes.js'
import booking from './routes/bookingroutes.js'
import doctorApplicationRoutes from './routes/doctorapplication.js'
import admin from './routes/adminroute.js'
const app = express()

app.use(express.json())
app.use(helmet())
app.use("/users",user_route)
app.use("/doctor", doctor)
app.use("/booking", booking)
app.use("/doctor-applications", doctorApplicationRoutes);
app.use("/admin", admin);

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