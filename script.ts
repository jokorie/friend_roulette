type Friend = {
    name: string;
    lastContacted: Date | null;
    cadence: number;
};

type AppState = {
    lastSelectedFriendName: string; // default can be empty string
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

document.addEventListener('DOMContentLoaded', async function () {
    console.log("start")
    let friendsData: FriendsData = await loadDataFromBackend();
    console.log("end");
    console.log(friendsData);
    let friends = friendsData.friends;
    let appState = friendsData.appState;

    let selectedFriendName = appState.lastSelectedFriendName;
    let intervalId: number | undefined;

    const gridContainer = document.getElementById('grid-container') as HTMLDivElement;
    const spinButton = document.getElementById('spin-button') as HTMLButtonElement;
    const confirmButton = document.getElementById('confirm-button') as HTMLButtonElement;
    const popupModal = document.getElementById('popup-modal') as HTMLDivElement;
    const popupMessage = document.getElementById('popup-message') as HTMLHeadingElement;

    document.getElementById('add-friend')?.addEventListener('click', async function () {
        const friendNameInput = document.getElementById('friend-name') as HTMLInputElement;
        const cadenceInput = document.getElementById('friend-cadence') as HTMLInputElement;
        const friendName = friendNameInput.value.trim();
        const cadence = parseInt(cadenceInput.value.trim(), 10);
    
        if (friendName && !isNaN(cadence)) {
            await addOrUpdateFriend(friendName, cadence);
            renderFriendsGrid();
            friendNameInput.value = '';
            cadenceInput.value = '';
        }
    });
    

    // Confirmation button event listener
    confirmButton.addEventListener('click', async function () {
        const selectedFriend = friends.find((friend) => friend.name === selectedFriendName);
        if (selectedFriend !== undefined) {
            selectedFriend.lastContacted = new Date();  // Update last contacted date
            appState.confirmationPending = false;  // No longer pending
            await saveDataToBackend({ friends, appState });
            spinButton.disabled = false;  // Re-enable spin button
            hidePopup();  // Hide the popup after confirmation
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
    

    function renderFriendsGrid() {
        gridContainer.innerHTML = '';
        friends.forEach((friend, index) => {
            if (shouldRenderFriend(friend)) {
                const div = document.createElement('div');
                div.classList.add('grid-item');
                div.textContent = friend.name;
                gridContainer.appendChild(div);

                if (friend.name === selectedFriendName) {
                    div.classList.add('highlighted');
                }
            }
        });
    }

    // Spin the wheel and stop at a random friend
    function spinWheel() {
        const gridItems = document.querySelectorAll('.grid-item');
        if (intervalId || gridItems.length === 0) {
            return;
        }

        let currentHighlightIndex = 0;
        spinButton.disabled = true;  // Disable spin button until confirmation

        let spinCount = 0;
        const maxSpins = Math.floor(Math.random() * 20) + 20;

        const namesSet = new Set<string>();
        gridItems.forEach(item => {
            const name = item.textContent?.trim(); // Get the name from the grid item
            if (name) {
                namesSet.add(name);
            }
        });

        

        intervalId = window.setInterval(() => {
            currentHighlightIndex = (currentHighlightIndex + 1) % friends.length;
            while (!namesSet.has(friends[currentHighlightIndex].name)) {
                currentHighlightIndex = (currentHighlightIndex + 1) % friends.length;
            }
            selectedFriendName = friends[currentHighlightIndex].name;  // Update currentHighlightIndex
            highlightSelected();
            spinCount++;

            if (spinCount >= maxSpins) {
                clearInterval(intervalId);
                intervalId = undefined;
                appState.lastSelectedFriendName = selectedFriendName;
                appState.confirmationPending = true;
                showPopup();  // Show the popup after spinning
                saveDataToBackend({ friends, appState });  // Save the updated state
            }
        }, 100);
    }

    function highlightSelected() {
        const gridItems = document.querySelectorAll('.grid-item');
        gridItems.forEach(item => {
            const name = item.textContent?.trim(); // Get the name from the grid item
            if (name === selectedFriendName) {
                item.classList.add('highlighted');
            }
            else {
                item.classList.remove('highlighted');
            }
        })
    }

    // Show the popup modal
    function showPopup() {
        if (selectedFriendName !== "") {
            popupMessage.textContent = `Confirm that you have contacted ${selectedFriendName}`;
        }
        setTimeout(() => {
            popupModal.classList.add('show');
            confirmButton.disabled = false;
        }, 500); // Delay of 0.5 seconds (500 milliseconds)
    }

    // Hide the popup modal
    function hidePopup() {
        popupModal.classList.remove('show');
    }

    // Load state and render grid on page load
    renderFriendsGrid();
    if (appState.confirmationPending) showPopup();
});
