export { default } from "next-auth/middleware"

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/team/:path*",
        "/settings/:path*"
    ]
}
