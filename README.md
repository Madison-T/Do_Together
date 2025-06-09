# DoTogether 

**DoTogether** is a collaborative decision-making mobile app built using Expo + Firebase. It is designed for friend groups to making choosing activities (like where to eat or what to watch) fast and fun using swipe-based voting.

---

##  Features

* Swipe-based activity voting
* Group creation and management
* Curated and custom activity lists
* Voting sessions with start/end timers
* Notifications
* Integration with TMDB (move database) and Google Places APIs
* Cross-platform: works on both Android and iOS

---

## 🛠 Installation

Before you begin, make sure you have [Node.js](https://nodejs.org/) and [Expo CLI](https://docs.expo.dev/get-started/installation/) installed.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/dotogether.git
cd dotogether
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add the required `apiKeys.js` file

> ⚠️ The app depends on external APIs (TMDB, Google Places) and Firebase configuration.
> You **must** obtain the `apiKeys.js` file to run the app.

**Where to get it:**

* Check the **Documentation** column on the project’s [Trello Board](https://trello.com/b/vmNZ7Pe5/2025s1w101dotogether)
* Or contact the **repository owner** for access

**Where to place it:**
Place the `apiKeys.js` file in the **root directory** of the project (same level as `firebaseConfig.js`)

---

### 4. Start the app

```bash
npx expo start
```

Open the app on your device using:

*  Expo Go (scan QR)
*  Android emulator
*  iOS simulator
*  Development build

---

## 📚 Learn More

* [Expo Documentation](https://docs.expo.dev/)
* [TMDB API Docs](https://developer.themoviedb.org/docs)
* [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview)
* [Firebase Docs](https://firebase.google.com/docs)

---

## 🤝 Contributing

If you'd like to contribute to DoTogether, feel free to open issues or submit pull requests.
Let’s Do it Together!
