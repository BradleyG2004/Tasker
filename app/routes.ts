import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("layout.tsx", [
    index("routes/home.tsx"),
    route("auth/login", "./auth/login.tsx"),
    route("auth/register", "./auth/register.tsx"),
  ]),
] satisfies RouteConfig;
