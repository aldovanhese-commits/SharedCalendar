import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// JOUW FIREBASE CONFIGURATIE (Zorg dat jouw ingevulde gegevens hier staan!)
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
let allUsers = [];

// DOM Elementen
const weekContainer = document.getElementById('weekContainer');
const weekTitle = document.getElementById('weekTitle');
const eventUserSelect = document.getElementById('eventUser');
const usersListDiv = document.getElementById('usersList');

// Modals
const eventModal = document.getElementById('eventModal');
const dayDetailModal = document.getElementById('dayDetailModal');
const settingsModal = document.getElementById('settingsModal');

// Realtime synchronisatie van Personen/Gebruikers
onSnapshot(collection(db, "users"), (snapshot) => {
    allUsers = [];
    eventUserSelect.innerHTML = '<option value="">Wie?</option>';
    usersListDiv.innerHTML = '';
    
    snapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        allUsers.push(userData);

        // Voeg toe aan dropdown kiezer
        const option = document.createElement('option');
        option.value = userData.name;
        option.innerText = userData.name;
        eventUserSelect.appendChild(option);

        // Voeg toe aan lijst in instellingen
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
            <div class="user-badge">
                <div class="color-dot" style="background-color: ${userData.color}"></div>
                <span>${userData.name}</span>
            </div>
            <button class="btn-delete" data-id="${doc.id}">Verwijder</button>
        `;
        usersListDiv.appendChild(userItem);
    });

    // Eventlisteners voor verwijderknoppen personen
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = async (e) => {
            await deleteDoc(doc(db, "users", e.target.dataset.id));
        };
    });

    renderWeek();
});

// Realtime synchronisatie van Evenementen
const qEvents = query(collection(db, "events"), orderBy("startTime"));
onSnapshot(qEvents, (snapshot) => {
    allEvents = [];
    snapshot.forEach((doc) => {
        allEvents.push({ id: doc.id, ...doc.data() });
    });
    renderWeek();
});

// Helper: Bereken Maandag van de week
function getStartOfWeek(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

// Render het weekoverzicht
function renderWeek() {
    weekContainer.innerHTML = '';
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    let tempDate = new Date(currentStartDate);
    
    weekTitle.innerText = `Week van ${currentStartDate.toLocaleDateString('nl-NL', {day: 'numeric', month: 'short'})}`;

    for (let i = 0; i < 7; i++) {
        const dateString = tempDate.toISOString().split('T')[0];
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        
        const dayTitle = document.createElement('div');
        dayTitle.className = 'day-title';
        dayTitle.innerText = tempDate.toLocaleDateString('nl-NL', options);
        dayCard.appendChild(dayTitle);

        const dayEvents = allEvents.filter(e => e.date === dateString);
        dayEvents.forEach(e => {
            const userObj = allUsers.find(u => u.name === e.user);
            const userColor = userObj ? userObj.color : '#8e8e93';

            const eventEl = document.createElement('div');
            eventEl.className = 'event';
            eventEl.style.backgroundColor = userColor;
            eventEl.innerHTML = `<span><strong>${e.startTime} - ${e.endTime}</strong> ${e.title}</span>`;
            dayCard.appendChild(eventEl);
        });

        // Klik-event om gedetailleerde dagplanning te openen
        const capturedDate = dateString;
        const capturedTitle = tempDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', island: 'true' });
        dayCard.addEventListener('click', () => openDayDetail(capturedDate, capturedTitle));

        weekContainer.appendChild(dayCard);
        tempDate.setDate(tempDate.getDate() + 1);
    }
}

// Toon gedetailleerd dagscherm per persoon
function openDayDetail(dateString, fullDayTitle) {
    document.getElementById('detailDayTitle').innerText = fullDayTitle;
    const listDiv = document.getElementById('dayEventsList');
    listDiv.innerHTML = '';

    const dayEvents = allEvents.filter(e => e.date === dateString);

    if (dayEvents.length === 0) {
        listDiv.innerHTML = '<p style="color:#8e8e93; text-align:center;">Geen activiteiten gepland.</p>';
    } else {
        dayEvents.forEach(e => {
            const userObj = allUsers.find(u => u.name === e.user);
            const userColor = userObj ? userObj.color : '#8e8e93';

            const div = document.createElement('div');
            div.className = 'detail-event-item';
            div.style.backgroundColor = userColor;
            div.innerHTML = `
                <div style="font-size:0.85rem; opacity:0.9;">${e.user}</div>
                <div style="font-weight:bold; font-size:1.1rem; margin:2px 0;">${e.startTime} - ${e.endTime}</div>
                <div>${e.title}</div>
            `;
            listDiv.appendChild(div);
        });
    }
    dayDetailModal.style.display = "block";
}

// Formulier Activiteit opslaan
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const startTime = document.getElementById('eventStartTime').value;
    const endTime = document.getElementById('eventEndTime').value;
    const user = document.getElementById('eventUser').value;

    await addDoc(collection(db, "events"), { title, date, startTime, endTime, user });
    eventModal.style.display = "none";
    document.getElementById('eventForm').reset();
});

// Formulier Persoon opslaan
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newUserName').value;
    const color = document.getElementById('newUserColor').value;

    await addDoc(collection(db, "users"), { name, color });
    document.getElementById('userForm').reset();
});

// Navigatie & Modal triggers
document.getElementById('prevWeek').onclick = () => { currentStartDate.setDate(currentStartDate.getDate() - 7); renderWeek(); };
document.getElementById('nextWeek').onclick = () => { currentStartDate.setDate(currentStartDate.getDate() + 7); renderWeek(); };

document.getElementById('openModalBtn').onclick = () => eventModal.style.display = "block";
document.getElementById('openSettingsBtn').onclick = () => settingsModal.style.display = "block";

document.getElementById('closeEventModal').onclick = () => eventModal.style.display = "none";
document.getElementById('closeDetailModal').onclick = () => dayDetailModal.style.display = "none";
document.getElementById('closeSettingsModal').onclick = () => settingsModal.style.display = "none";

window.onclick = (e) => {
    if (e.target == eventModal) eventModal.style.display = "none";
    if (e.target == dayDetailModal) dayDetailModal.style.display = "none";
    if (e.target == settingsModal) settingsModal.style.display = "none";
};
