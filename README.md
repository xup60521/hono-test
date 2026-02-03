# hono

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.7. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

---

This is the rewrite version of [fullstack-syosetsu-translator](https://github.com/xup60521/fullstack-syosetsu-translator) in Hono. This project only contains the backend part. If you are looking for a fullstack solution, go check the original repository or take a look at the [hono+react](https://github.com/xup60521/bun-react-router-hono-syosetsu-translator) version instead.

Note that it doesn't work with serverless environment (e.g. Vercel). The function crashes and I cannot figure out why. Nonetheless, if you serve it directly, it works perfectly fine. Same with [hono+react](https://github.com/xup60521/bun-react-router-hono-syosetsu-translator).

This is an experiment that aims to re-think the relation between frontend and backend. It turns out that existed fullstack frameworks are just good enough that it is not worthwhile to roll your own. Hono and React are good on thier own, but if you are looking for good DX, just use a framework.