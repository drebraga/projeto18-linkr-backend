import {Router} from 'express';
import { signUp, signIn, logOut, GetUserByToken} from '../controllers/auth.controller.js';
import { signUpSchemaValidation, signInSchemaValidation } from '../middlewares/auth.middleware.js';

const authRouter = Router();

authRouter.post("/sign-up", signUpSchemaValidation, signUp);
authRouter.post("/sign-in",signInSchemaValidation ,signIn);
authRouter.delete("/logout", logOut);
authRouter.post("/get-user", GetUserByToken);

export default authRouter;