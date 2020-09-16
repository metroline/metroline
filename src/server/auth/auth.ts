import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { Socket } from 'socket.io';
import chalk from 'chalk';
import { ObjectId } from 'mongodb';
import { env } from '../env';
import { Logger } from '../../commons/logger/logger';
import { User, Users } from '../users/user';
import { createOrUpdateUser, PassportUser } from './create-or-update-user';
import { UnauthorizedError } from '../../commons/errors/unauthorized-error';

const logger = new Logger('metroline.server:auth');

const cookieName = 'auth';

function cookieOptions() {
  return {
    httpOnly: true,
    path: '/',
    expires: new Date(new Date().getTime() + env.METROLINE_JWT_TOKEN_EXPIRATION * 1000),
    secure: env.METROLINE_COOKIE_SECURE,
    sameSite: env.METROLINE_COOKIE_SAMESITE,
  };
}

interface JwtToken {
  userId: string;
}

function verifyToken(token: string): Promise<User> {
  return new Promise<User>((resolve, reject) => {
    jwt.verify(token, env.METROLINE_JWT_SECRET, {}, (err, { userId }: JwtToken) => {
      if (err) {
        return reject(err);
      }
      Users()
        .findOne({ _id: ObjectId.createFromHexString(userId) })
        .then(user => {
          if (!user) {
            throw new Error(`Jwt token contained user ${userId} which was not found`);
          } else {
            resolve(user);
          }
        })
        .catch(reject);
    });
  });
}

export function authorizeReq(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.auth;
  logger.debug(`found token "${token}" in request`);
  if (!token) {
    return next();
  }
  verifyToken(token)
    .then(user => {
      logger.debug(`setting req.user with user ${chalk.blue(user._id.toHexString())}`);
      req.user = user;
    })
    .catch(err => {
      logger.debug(err);
      res.cookie(cookieName, '', cookieOptions());
    })
    .then(next);
}

const allowedOrgs = new Set(env.METROLINE_ORGS);

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const passportUser = req.user as PassportUser;
  if (allowedOrgs.size !== 0 && passportUser.orgs.every(org => !allowedOrgs.has(org))) {
    logger.debug(`user ${
      chalk.blue(`${passportUser.id}/${passportUser.name}`)
    } not allowed to login as none of their orgs ${
      chalk.blue(`[${passportUser.orgs.join(',')}]`)
    } matched allowed orgs ${
      chalk.blue(`[${env.METROLINE_ORGS.join(',')}]`)
    }`);
    return next(new UnauthorizedError(`Not allowed to login as you are not part of these orgs: [${env.METROLINE_ORGS.join(',')}]`));
  }
  createOrUpdateUser(passportUser)
    .then<JwtToken>(user => ({ userId: user._id.toHexString() }))
    .then(tokenPayload => {
      jwt.sign(tokenPayload, env.METROLINE_JWT_SECRET, (err, token) => {
        if (err) {
          return next(err);
        }
        logger.debug(`Redirecting to ${env.METROLINE_UI_URL} with cookie ${cookieName} ${JSON.stringify(cookieOptions(), null, 2)}`);
        res
          .cookie(cookieName, token, cookieOptions())
          .redirect(env.METROLINE_UI_URL);
      });
    })
    .catch(next);
}

export function signOut(req: Request, res: Response) {
  res
    .cookie(cookieName, '', cookieOptions())
    .status(204)
    .send();
}

export function getUserFromSocket(socket: Socket): Promise<User> {
  const cookies = cookie.parse(socket.handshake.headers.cookie || '');
  const token = cookies[cookieName];
  return verifyToken(token).catch(() => undefined);
}
