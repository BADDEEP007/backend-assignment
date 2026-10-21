import argon2 from 'argon2';
import jwt from "jsonwebtoken";



class AuthService {
    constructor(userRepository) {
        this.userRepository = userRepository
    }
    async register({ name, email, password }) {
        try {
            const existing_user = await this.userRepository.findbyEmail(email);

            if (existing_user) {
                const { passwordHash: _, ...safe_user } = existing_user;
                return {
                    mssg: 'already exist please login',
                    exist: true,
                    user: safe_user


                }
            }
            const password_hash = await argon2.hash(password)

            const user = await this.userRepository.create({
                name,
                email,
                passwordHash: password_hash,
                role:  'PATIENT'
            })
            const { passwordHash: _, ...safe_user } = user;
            return {
                success: 'success',
                safe_user
            }

        } catch (error) {
            console.log(error)
            return { err: error }

        }
    }

    async login({ email, password }) {
        try {
            const user = await this.userRepository.findbyEmail(
                email.trim().toLowerCase()
            );
            if (!user) {
                const error = new Error("Invalid email or password");
                error.status = 401;
                throw error;
            }

            const passwordMatches = await argon2.verify(
                user.passwordHash,
                password
            );

            if (!passwordMatches) {
                const error = new Error("Invalid email or password");
                error.status = 401;
                throw error;
            }

            const secret = process.env.JWT_SECRET;

            if (!secret) {
                throw new Error("JWT_SECRET is not configured");
            }

            const token = jwt.sign(
                { role: user.role },
                secret,
                {
                    subject: user.id,
                    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
                }
            );

            const { passwordHash: _, ...safeUser } = user;

            return {
                success:true,
                user: safeUser,
                token
            };


        } catch (error) {
            
            return { 
                success: false,
                err: {
                    message: error.message || "An unexpected error occurred",
                    status: error.status || 500
                }
            };
        }

    }
}

export default AuthService