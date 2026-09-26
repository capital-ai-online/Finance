# 💻 Code Quality Standards & Architecture Directives
**Project: CAPITAL-AI**  
**Version:** 0.6.5 (Beta-Phase)
**Standard:** TypeScript Strict Mode (`strict: true`)  

---

## 📐 General Code Integrity (Datenintegrität)
CAPITAL-AI maintains strict quality standards to ensure enterprise-level performance, clean refactors, and complete compliance with European regulations:

1. **Strict Type-Safety**: Avoid using `any`. Explicitly declare TypeScript interfaces and models for all parameters, components, and API responses.
2. **Defensive API Contracts**: All API responses must be validated upon receipt. Never assume any response is an array or object of correct shape without checking `Array.isArray()` or proper structural type guards. Handle exceptions gracefully without crashing components.
3. **No Legacy Versioning**: All references to deprecated version numbers are omitted. The entire platform is strictly pinned to **Version 0.6.5** (Beta-Phase) representing the current unified release.

---

## 🛠️ Mandatory Coding Conventions

### 1. TypeScript Coding Rules
* **Standard Enums**: Always declare enums using standard `enum` definitions rather than `const enum` to prevent compiler mapping mismatches across bundlers.
* **Named Imports**: Always utilize named imports at the top-level of the file instead of full object destructuring on default imports.

```typescript
// PREFERRED PATTERN
import { Sparkles, Shield, Award } from 'lucide-react';
import { SubscriptionTier } from '../types';
```

### 2. Modularity & Token Budget Constraints
To prevent generation cutoff and massive compile overhead:
* **File Size Constraint**: Individual source files must never exceed **500 lines**.
* **Extract Early**: Do not consolidate all logic into single files like `App.tsx` or `Screener.tsx`. Move sub-components into `/src/components/`, common utility functions into `/src/utils/`, and static database definitions into dedicated files.
* **Shared Types**: Always export shared interfaces from `/src/types.ts` to prevent circular import trees.

### 3. Component Hook Safety (useEffect Guidelines)
* **Zero Body Updates**: Never write state mutators directly inside the component body.
* **Primitive Dependencies**: Dependency arrays in `useEffect`, `useMemo`, and `useCallback` must strictly use primitive values (strings, numbers, booleans) or heavily memoized objects.

```typescript
// CORRECT PATTERN
useEffect(() => {
  let isCurrent = true;
  const loadContent = async () => {
    try {
      const response = await fetch(`/api/docs-file?path=${docPath}`);
      const data = await response.json();
      if (isCurrent) setContent(data.content);
    } catch (err) {
      console.error(err);
    }
  };
  loadContent();
  return () => {
    isCurrent = false; // Cleanup to prevent race conditions
  };
}, [docPath]); // docPath is a primitive string
```

---

## ⚡ Performance KPIs & Auditing
- **Render Latency**: Keep components light and eliminate redundant virtual DOM repaints.
- **Serverless Cold-Start Limit**: Maintain container coldstarts below **1.5 seconds** by using lazy-loaded imports for large client libraries like `Stripe` or `@supabase/supabase-js`.
- **Lighthouse Goals**: Target values for mobile and desktop are strictly **> 90 points** for performance, best practices, accessibility, and SEO.
