type Friend = {
    name: string;
    lastContacted: Date | null;
    cadence: number;
};

type AppState = {
    lastSelectedFriendName: string; // default can be an empty string
    confirmationPending: boolean;
};

type FriendsData = {
    friends: Friend[];
    appState: AppState;
};

function createFriend(name: string, cadence: number): Friend {
    return {
        name,
        lastContacted: null,
        cadence, // Set the desired cadence in days
    };
}

function getDaysSinceLastContact(date: Date | null): number {
    if (date === null) {
        return -1; // If never contacted, return -1
    }
    const now = new Date();
    // console.log(date);
    // console.log(date.getTime());
    const differenceInTime = now.getTime() - (new Date(date)).getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
}

document.addEventListener('DOMContentLoaded', async function () {
    // Load data from the backend and initialize the application
    let friendsData: FriendsData = await loadDataFromBackend();
    let friends = friendsData.friends;
    let appState = friendsData.appState;

    let intervalId: number | undefined;

    const container = document.getElementById('container') as HTMLDivElement;
    const gridContainer = document.getElementById('grid-container') as HTMLDivElement;
    const spinButton = document.getElementById('spin-button') as HTMLButtonElement;
    const confirmButton = document.getElementById('confirm-button') as HTMLButtonElement;
    const popupMessage = document.getElementById('popup-message') as HTMLHeadingElement;
    const showAllCheckbox = document.getElementById('show-all') as HTMLInputElement;

    const cadenceSelector = document.getElementById('cadence-selector') as HTMLDivElement;
    const cadenceInput = document.getElementById('friend-cadence') as HTMLInputElement;

    // Event listener for cadence selection
    cadenceSelector.addEventListener('click', function (e) {
        const target = e.target as HTMLElement;
        if (target.classList.contains('cadence-box')) {
            document.querySelectorAll('.cadence-box').forEach(box => {
                box.classList.remove('selected');
            });
            target.classList.add('selected');
            const selectedCadence = target.getAttribute('data-cadence');
            if (selectedCadence) {
                cadenceInput.value = selectedCadence;
            }
        }
    });

    document.getElementById('add-friend')?.addEventListener('click', async function () {
        const friendNameInput = document.getElementById('friend-name') as HTMLInputElement;
        const friendName = friendNameInput.value.trim();
        const cadence = parseInt(cadenceInput.value.trim(), 10);
    
        if (friendName && !isNaN(cadence)) {
            await addOrUpdateFriend(friendName, cadence);
            renderFriendsGrid();
            friendNameInput.value = '';
            cadenceInput.value = '';
        }
    });

    // Event listener for toggling the view
    showAllCheckbox.addEventListener('change', renderFriendsGrid);
    

    // Confirmation button event listener
    confirmButton.addEventListener('click', async function () {
        const selectedFriend = friends.find((friend) => friend.name === appState.lastSelectedFriendName);
        if (selectedFriend !== undefined) {
            selectedFriend.lastContacted = new Date();  // Update last contacted date
            appState.confirmationPending = false;  // No longer pending
            spinButton.disabled = false;  // Re-enable spin button
            spinButton.classList.remove('disabled');  // Remove disabled styling
            hidePopup();  // Hide the popup after confirmation
            await saveDataToBackend({ friends, appState });
            friendsData = await loadDataFromBackend(); // Refresh data from backend
            friends = friendsData.friends;
            renderFriendsGrid();
        }
    });


    // Spin the wheel button event listener
    spinButton.addEventListener('click', spinWheel);

    async function addOrUpdateFriend(friendName: string, cadence: number) {
        const existingFriend = friends.find(friend => friend.name === friendName);
        if (existingFriend) {
            existingFriend.lastContacted = null;
            existingFriend.cadence = cadence;
        } else {
            const newFriend: Friend = { name: friendName, lastContacted: null, cadence};
            friends.push(newFriend);
        }
        await saveDataToBackend({ friends, appState });
    }

    async function saveDataToBackend(data: FriendsData) {
        await fetch('http://localhost:3000/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    }

    async function loadDataFromBackend(): Promise<FriendsData> {
        console.log("before response");
        const response = await fetch('http://localhost:3000/data');
        console.log(response);
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        return await response.json();
    }

    function shouldRenderFriend(friend: Friend): boolean {
        if (!friend.lastContacted) {
            return true; // If never contacted, render the friend
        }
    
        const now = new Date();
        const lastContactedDate = new Date(friend.lastContacted);
        const daysSinceLastContact = Math.floor((now.getTime() - lastContactedDate.getTime()) / (1000 * 60 * 60 * 24));
    
        return daysSinceLastContact >= friend.cadence;
    }
    

    // Function to render the friends grid
    function renderFriendsGrid() {
        gridContainer.innerHTML = '';
        const showAll = showAllCheckbox.checked;
        
        friends.forEach(friend => {
            if (showAll || shouldRenderFriend(friend)) {
                const div = document.createElement('div');
                div.classList.add('grid-item');
                
                const nameElement = document.createElement('div');
                nameElement.classList.add('friend-name');
                nameElement.textContent = friend.name;
                
                console.log(friend);
                const daysSinceLastContact = getDaysSinceLastContact(friend.lastContacted);
                const daysElement = document.createElement('div');
                daysElement.classList.add('days-since');
                daysElement.textContent = (daysSinceLastContact === -1)
                    ? 'Never contacted'
                    : `${daysSinceLastContact} days since last contact`;

                div.appendChild(nameElement);
                div.appendChild(daysElement);
                gridContainer.appendChild(div);

                if (friend.name === appState.lastSelectedFriendName) {
                    div.classList.add('highlighted');
                }
            }
        });
    }
    

    // Function to handle the spin wheel action
    function spinWheel() {
        const eligibleFriends = friends.filter(friend => shouldRenderFriend(friend));
        if (intervalId || eligibleFriends.length === 0) {
            return;
        }

        let currentHighlightIndex = 0;
        spinButton.disabled = true;

        let spinCount = 0;
        const maxSpins = Math.floor(Math.random() * 20) + 20;

        // Only consider friends who are due for contact
        const namesSet = new Set(eligibleFriends.map(friend => friend.name));

        intervalId = window.setInterval(() => {
            currentHighlightIndex = (currentHighlightIndex + 1) % friends.length;
            while (!namesSet.has(friends[currentHighlightIndex].name)) {
                console.log("6");
                currentHighlightIndex = (currentHighlightIndex + 1) % friends.length;
            }
            appState.lastSelectedFriendName = friends[currentHighlightIndex].name;
            highlightSelected();
            spinCount++;

            if (spinCount >= maxSpins) {
                clearInterval(intervalId);
                intervalId = undefined;
                appState.confirmationPending = true;
                showPopup();
                saveDataToBackend({ friends, appState });
            }
        }, 100);
    }


    function highlightSelected() {
        const gridItems = document.querySelectorAll('.grid-item');
        gridItems.forEach(item => {
            const nameElement = item.querySelector('.friend-name');
            const name = nameElement?.textContent?.trim(); // Get the name from the grid item
            if (name === appState.lastSelectedFriendName) {
                item.classList.add('highlighted');
            }
            else {
                item.classList.remove('highlighted');
            }
        });
    }

    // Show the popup modal
    function showPopup() {
        if (appState.lastSelectedFriendName !== "") {
            popupMessage.innerHTML = `Confirm that you have contacted <span class="friend-name">${appState.lastSelectedFriendName}</span>`;
        }
        container.classList.add('split'); // Trigger the split view layout

        setTimeout(() => {
            confirmButton.disabled = false;
        }, 500); // Delay of 0.5 seconds (500 milliseconds)

        spinButton.classList.add('disabled');  // Apply disabled styling
    }


    // Function to hide the popup and enable the spin button
    function hidePopup() {
        container.classList.remove('split'); // Revert back to single panel layout
        appState.lastSelectedFriendName = "";
        console.log(appState.lastSelectedFriendName);
        confirmButton.disabled = true;
        highlightSelected();  // to unselect all
    }

    // Load state and render grid on page load
    renderFriendsGrid();
    if (appState.confirmationPending) {
        spinButton.classList.add('disabled');  // Apply disabled styling if confirmation is pending
        showPopup();
    }
});

