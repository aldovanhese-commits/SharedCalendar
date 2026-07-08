import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// JOUW FIREBASE CONFIGURATIE (Vervang dit met je eigen Firebase credentials)
const firebaseConfig = {
  apiKey: "AIzaSyBIp5uiJY7czs6tyi5DrOcdEQ2-MeTP3HY",
  authDomain: "shared-calendar-1bf72.firebaseapp.com",
  databaseURL: "https://shared-calendar-1bf72-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "shared-calendar-1bf72",
  storageBucket: "shared-calendar-1bf72.firebasestorage.app",
  messagingSenderId: "1006114453087",
  appId: "1:1006114453087:web:e5c574edce92f6c0cd0dea",
  measurementId: "G-YXL28X5M8W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentStartDate = getStartOfWeek(new Date());
let allEvents = [];

// DOM Elementen
const weekContainer = document.getElementById('weekContainer');
const weekTitle = document.getElementById('weekTitle');
const modal = document.getElementById('eventModal');

// Firebase Realtime Listener
const q = query(collection(db, "events"), orderBy("time"));
onSnapshot(q, (snapshot) => {
    allEvents = [];
    snapshot.forEach((doc) => {
        allEvents.push({ id: doc.id, ...doc.data() });
    });
    renderWeek();
});

// Helper: Krijg de maandag van de huidige week
function getStartOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

function renderWeek() {
    weekContainer.innerHTML = '';
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    
    let tempDate = new Date(currentStartDate);
    
    // Toon de weekrange in de header
    weekTitle.innerText = `Week van ${currentStartDate.toLocaleDateString('nl-NL', {day: 'numeric', month: 'short'})}`;

    for (let i = 0; i < 7; i++) {
        const dateString = tempDate.toISOString().split('T')[0];
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        const dayTitle = document.createElement('div');
        dayTitle.className = 'day-title';
        dayTitle.innerText = tempDate.toLocaleDateString('nl-NL', options);
        dayCard.appendChild(dayTitle);

        // Filter evenementen voor deze specifieke dag
        const dayEvents = allEvents.filter(e => e.date === dateString);
        dayEvents.forEach(e => {
            const eventEl = document.createElement('div');
            eventEl.className = `event ${e.user.toLowerCase().replace(' ', '-')}`;
            eventEl.innerHTML = `<span><strong>${e.time}</strong> - ${e.title}</span> <span>${e.user}</span>`;
            dayCard.appendChild(eventEl);
        });

        weekContainer.appendChild(dayCard);
        tempDate.setDate(tempDate.getDate() + 1);
    }
}

// Navigatie
document.getElementById('prevWeek').addEventListener('click', () => { currentStartDate.setDate(currentStartDate.getDate() - 7); renderWeek(); });
document.getElementById('nextWeek').addEventListener('click', () => { currentStartDate.setDate(currentStartDate.getDate() + 7); renderWeek(); });

// Modal Logica
document.getElementById('openModalBtn').onclick = () => modal.style.display = "block";
document.querySelector('.close').onclick = () => modal.style.display = "none";

// Formulier verzenden naar Firebase
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const user = document.getElementById('eventUser').value;

    await addDoc(collection(db, "events"), { title, date, time, user });
    
    modal.style.display = "none";
    document.getElementById('eventForm').reset();
});
