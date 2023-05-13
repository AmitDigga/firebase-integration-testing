# firebase-integration-testing

This is a sample project showing firebase integration testing. We will use Firebase Emulator for testing. It will involve firestore and functions. This is for reference purpose only for an article. It may not work as expected when trying for your own project.

## Clone and Setup Your Project

Disclaimer: For reference purpose only. Some hints are there to setup your own newly created project with this repo. Many tweaking will be needed on your end.

### Step 1: Create a Project on Firebase Console

Create by visiting <https://console.firebase.google.com/>. You can enable Authentication, Firestore database, Firebase Cloud Functions, and Realtime Database in the Firebase console as needed.

### Step 2: Setting up Project Locally

1. Clone this repo.
2. Run `npm install`.
3. Install firebase tools and do login in their cli
4. Set this project as the local of your already created firebase project. Care for security rules.
5. Update your project id in `.firebaserc` and `functions\__test__\config.ts` file.
6. Run `npm test` to see if everything is working as expected or not.

### Troubleshoot

If you encounter an error during initialization, you may need to go to the Firebase Dashboard -> Project Settings -> General and set the "Default GCP resource location" again.
