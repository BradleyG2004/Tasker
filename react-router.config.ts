import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  future: {
    unstable_middleware: true,
  },
  ssr: true,
} satisfies Config;

// import type { Config } from "@react-router/dev/config";

// export default {
//   future: {
//     unstable_middleware: true,
//   },
// } satisfies Config;

