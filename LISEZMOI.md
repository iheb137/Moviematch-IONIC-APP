# MovieMatch : installation des fichiers

1. Sauvegardez votre dossier `src/app` actuel (ex. renommez-le `app_old`).
2. Copiez `src/app` de cette archive à la place, et remplacez `src/main.ts`.
3. NE remplacez PAS `src/environments/environment.ts` : ajoutez seulement `tmdbApiKey` à votre fichier
   (voir `environment.example.ts`).
4. `npm install @ionic/pwa-elements`
5. Console Firebase > Firestore > Règles : collez `firestore.rules` puis Publier.
6. `ionic serve`

Matching : indice de Jaccard |A ∩ B| / |A ∪ B| × 100, seuil strict > 75 % (src/app/matching.ts).
