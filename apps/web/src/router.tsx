import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { Gallery } from "./surfaces/gallery";
import { ProductApp } from "./product-app";

function RootLayout() {
  return <Outlet />;
}

const rootRoute = createRootRoute({ component: RootLayout });
const productRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ProductApp,
});
const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: Gallery,
});

const routeTree = rootRoute.addChildren([productRoute, galleryRoute]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
