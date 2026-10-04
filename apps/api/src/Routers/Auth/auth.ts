import { signup , signin , logout } from "../../controllers/auth.router.js";
import { SendOtp , verifyEmail  } from "../../controllers/email.rotuer.js";

import Express  from "express";
import type {Router} from "express"

const router : Router = Express.Router()

router.post("/signup" , signup)
router.post("/signin" , signin)
router.post("/logout", logout)

router.post('/email/send' , SendOtp)
router.post('/email/verify', verifyEmail)

export default router 