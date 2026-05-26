import type { CookieOptions, Request, Response } from "express"
import { TRPCContext } from "../context";

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_MONTH = 30 * ONE_DAY;
const ONE_YEAR = 12 * ONE_MONTH;

const AUTHENTICATION_COOKIE_NAME = "authentication-token";

const defaultCookieOption: CookieOptions = {
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: ONE_YEAR
}

export function createCookieFactory(res: Response) {
    return function createCookie(
        name: string,
        value: string, 
        opts: CookieOptions = defaultCookieOption
    ) {

        res.cookie(name, value, {
            ...opts
        })
    }
}

export function getCookieFactory(req: Request) {
    return function getCookie(name: string) {
        return req.cookies?.[name];
    }
}

export function clearCookieFactory(res: Response) {
    return function clearCookie(name: string) {
        return res.clearCookie(name);
    }
}

export function setAuthentication(ctx: TRPCContext, accessToken: string) {
    ctx.createCookie(AUTHENTICATION_COOKIE_NAME, accessToken)
}

export function getAuthentication(ctx: TRPCContext) {
    return ctx.getCookie(AUTHENTICATION_COOKIE_NAME);
}

export function clearAuthentication(ctx: TRPCContext) {
    ctx.clearCookie(AUTHENTICATION_COOKIE_NAME);
}