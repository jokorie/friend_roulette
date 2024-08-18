type Friend = {
    name: string;
    lastContacted: Date | null;
};

type AppState = {
    lastSelectedIndex: number | undefined;
    confirmationPending: boolean;
};

type FriendsData = {
    friends: Friend[];
    appState: AppState;
};

document.addEventListener('DOMContentLoaded', async function () {
    let friendsData: FriendsData = await loadDataFromBackend();
    console.log(friendsData);
    let friends = friendsData.friends;
    let appState = friendsData.appState;

    let selectedIndex = appState.lastSelectedIndex;
    let currentHighlightIndex = 0;
    let intervalId: number | undefined;

    const gridContainer = document.getElementById('grid-container') as HTMLDivElement;
    const spinButton = document.getElementById('spin-button') as HTMLButtonElement;
    const confirmButton = document.getElementById('confirm-button') as HTMLButtonElement;
    const popupModal = document.getElementById('popup-modal') as HTMLDivElement;
    const popupMessage = document.getElementById('popup-message') as HTMLHeadingElement;

    document.getElementById('add-friend')?.addEventListener('click', async function () {
        const friendNameInput = document.getElementById('friend-name') as HTMLInputElement;
        const friendName = friendNameInput.value.trim();
        if (friendName) {
            await addOrUpdateFriend(friendName);
            friendsData = await loadDataFromBackend(); // Refresh data from backend
            friends = friendsData.friends;
            renderFriendsGrid();
            friendNameInput.value = '';
        }
    });

    // Confirmation button event listener
    confirmButton.addEventListener('click', async function () {
        if (selectedIndex !== undefined) {
            friends[selectedIndex].lastContacted = new Date();  // Update last contacted date
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

    async function addOrUpdateFriend(friendName: string) {
        const existingFriend = friends.find(friend => friend.name === friendName);
        if (existingFriend) {
            existingFriend.lastContacted = null;
        } else {
            const newFriend: Friend = { name: friendName, lastContacted: null };
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
        const response = await fetch('http://localhost:3000/data');
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        return await response.json();
    }

    function renderFriendsGrid() {
        gridContainer.innerHTML = '';
        friends.forEach((friend, index) => {
            const div = document.createElement('div');
            div.classList.add('grid-item');
            div.textContent = friend.name;
            gridContainer.appendChild(div);

            if (index === selectedIndex) {
                div.classList.add('highlighted');
            }
        });
    }

    // Spin the wheel and stop at a random friend
    function spinWheel() {
        if (intervalId || friends.length === 0) {
            return;
        }

        spinButton.disabled = true;  // Disable spin button until confirmation

        let spinCount = 0;
        const maxSpins = Math.floor(Math.random() * 20) + 20;
        const gridItems = document.querySelectorAll('.grid-item');

        intervalId = window.setInterval(() => {
            selectedIndex = (currentHighlightIndex + 1) % gridItems.length;
            currentHighlightIndex = selectedIndex;  // Update currentHighlightIndex
            highlightSelected();
            spinCount++;

            if (spinCount >= maxSpins) {
                clearInterval(intervalId);
                intervalId = undefined;
                appState.confirmationPending = true;
                appState.lastSelectedIndex = selectedIndex;
                appState.confirmationPending = true;
                showPopup();  // Show the popup after spinning
                saveDataToBackend({ friends, appState });  // Save the updated state
            }
        }, 100);
    }

    function highlightSelected() {
        if (selectedIndex === undefined) {
            throw new Error("Selected index is undefined. Cannot highlight friend");
        }
        const gridItems = document.querySelectorAll('.grid-item');
        gridItems.forEach(item => item.classList.remove('highlighted'));
        gridItems[selectedIndex].classList.add('highlighted');
    }

    // Show the popup modal
    function showPopup() {
        if (selectedIndex !== undefined) {
            popupMessage.textContent = `Confirm that you have contacted ${friends[selectedIndex].name}`;
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
