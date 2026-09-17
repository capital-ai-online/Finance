/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SessionComposition } from './auth/SessionComposition';
import { ProductVocabularyBoundary } from './presentation/ProductVocabularyBoundary';
import { AppRoutes } from './routing/AppRoutes';
import { UniversePathBoundary } from './universe/ui/UniversePathBoundary';

/**
 * Canonical BB-1 application composition root.
 *
 * Session/auth concerns and route/presentation concerns are deliberately kept
 * in separate composition modules. Feature internals remain untouched until
 * their dedicated migration waves.
 */
export default function App() {
  return (
    <ProductVocabularyBoundary>
      <UniversePathBoundary>
        <SessionComposition>
          {(session) => <AppRoutes {...session} />}
        </SessionComposition>
      </UniversePathBoundary>
    </ProductVocabularyBoundary>
  );
}
