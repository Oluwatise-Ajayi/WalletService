
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateGoogleUser(details: {
        email: string;
        googleId: string;
        firstName: string;
        lastName: string;
        picture: string;
    }) {
        // Transaction to ensure User creation + Wallet creation is atomic
        const user = await this.prisma.$transaction(async (prisma) => {
            let user = await prisma.user.findUnique({
                where: { googleId: details.googleId },
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email: details.email,
                        googleId: details.googleId,
                        firstName: details.firstName,
                        lastName: details.lastName,
                        picture: details.picture,
                    },
                });

                // Create Wallet
                await prisma.wallet.create({
                    data: {
                        userId: user.id,
                    },
                });
            }
            return user;
        });

        return user;
    }

    async login(user: User) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }
}
