import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

const { POST } = createRefreshAuthRouter({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
});

export { POST };
