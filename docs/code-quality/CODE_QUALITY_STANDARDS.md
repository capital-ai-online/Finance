# 💻 Code Quality Standards & Best Practices
**Project: Jenova Nexus (AIF-CORE)**
**Language: TypeScript Strict Mode**

---

## 📐 General Principles

All code in Jenova Nexus must be written with readability, performance, and type-safety in mind. We operate on strict TypeScript rules (`strict: true` in `tsconfig.json`).

---

## 🛠️ Strict Coding Standards

### 1. TypeScript & Type-Safety
* **No `any` Types**: Explicitly declare types or interfaces for all parameters, states, and return payloads. If a third-party module uses `any`, cast it using custom guards or generics.
* **Module Systems**: All `import` statements must reside at the very top of the file. Use named imports instead of object destructuring where possible.
* **Standard Enums**: Use standard `enum` declarations instead of `const enum`.

```typescript
// PREFERRED PATTERN
export enum SubscriptionTier {
  FREE = 'Free',
  STARTER = 'Starter',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise'
}
```

### 2. File Modularity vs. Bloat
* **Keep Files under 500 lines**: Do not compile all logic inside a single monolithic file (like `App.tsx` or `Screener.tsx`). Extract reusable sub-components, helper functions, and static parameters into dedicated modules inside `/src/components/`, `/src/utils/`, or `/src/types.ts`.
* **Establish Type Files Early**: Shared interfaces must be exported from `/src/types.ts` to prevent circular dependency problems.

### 3. Component Lifecycle & Hook Safety
To prevent heavy CPU usage or visual flickering, adhere strictly to the following `useEffect` guidelines:
* Never update a state value directly inside the component body.
* Keep dependency arrays as simple and primitive as possible.

```typescript
// CORRECT PATTERN
useEffect(() => {
  let active = true;
  fetch('/api/data')
    .then(res => res.json())
    .then(data => {
      if (active) setData(data);
    });
  return () => {
    active = false; // clean up routine
  };
}, [primitiveDependencyId]); // Primitive dependencies prevent infinite loops
```

---

## ⚡ Performance Metric Goals
- **Lighthouse Score**: Performance > 90, Accessibility > 95, Best Practices > 95.
- **Server Cold-start**: Below **1.5s** on standard serverless environments (realized by lazy-loading heavy SDK clients like Stripe and Supabase, and bundling with esbuild).
