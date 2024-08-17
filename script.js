"use strict";
document.addEventListener('DOMContentLoaded', function () {
    var _a;
    let friends = [];
    let selectedIndex;
    let confirmationPending = false;
    let currentHighlightIndex = 0;
    let intervalId;
    const gridContainer = document.getElementById('grid-container');
    const spinButton = document.getElementById('spin-button');
    const confirmButton = document.getElementById('confirm-button');
    const popupModal = document.getElementById('popup-modal');
    const popupMessage = document.getElementById('popup-message');
    (_a = document.getElementById('add-friend')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
        const friendNameInput = document.getElementById('friend-name');
        const friendName = friendNameInput.value.trim();
        if (friendName) {
            addOrUpdateFriend(friendName);
            renderFriendsGrid();
            saveState();
            friendNameInput.value = '';
        }
    });
    // Confirmation button event listener
    confirmButton.addEventListener('click', function () {
        if (selectedIndex !== undefined) {
            friends[selectedIndex].lastContacted = new Date(); // Update last contacted date
            spinButton.disabled = false; // Re-enable spin button
            hidePopup(); // Hide the popup after confirmation
            saveState();
        }
    });
    // Spin the wheel button event listener
    spinButton.addEventListener('click', spinWheel);
    // Handle adding or updating a friend
    function addOrUpdateFriend(friendName) {
        const duplicated_index = friends.findIndex(friend => friend.name === friendName);
        if (duplicated_index !== -1) {
            friends[duplicated_index].lastContacted = null;
        }
        else {
            friends.push({ name: friendName, lastContacted: null });
        }
    }
    function renderFriendsGrid() {
        gridContainer.innerHTML = '';
        friends.forEach((friend) => {
            const div = document.createElement('div');
            div.classList.add('grid-item');
            div.textContent = friend.name;
            gridContainer.appendChild(div);
        });
        highlightSelected();
    }
    // Spin the wheel and stop at a random friend
    function spinWheel() {
        if (intervalId || friends.length === 0) {
            return;
        }
        spinButton.disabled = true; // Disable spin button until confirmation
        let spinCount = 0;
        const maxSpins = Math.floor(Math.random() * 20) + 20;
        const gridItems = document.querySelectorAll('.grid-item');
        intervalId = window.setInterval(() => {
            selectedIndex = (currentHighlightIndex + 1) % gridItems.length;
            currentHighlightIndex = selectedIndex; // Update currentHighlightIndex
            highlightSelected();
            spinCount++;
            if (spinCount >= maxSpins) {
                clearInterval(intervalId);
                intervalId = undefined;
                confirmationPending = true;
                showPopup(); // Show the popup after spinning
                saveState();
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
        }, 500); // Delay of 1 second (1000 milliseconds)
    }
    // Hide the popup modal
    function hidePopup() {
        popupModal.classList.remove('show');
    }
    // Load the state from localStorage
    function loadState() {
        const storedFriends = localStorage.getItem('friends');
        const storedIndex = localStorage.getItem('selectedIdx');
        const storedConfirmationPending = localStorage.getItem('pending');
        if (storedFriends !== null && storedFriends) {
            friends = JSON.parse(storedFriends);
        }
        if (storedIndex !== null && storedIndex !== "undefined") {
            selectedIndex = JSON.parse(storedIndex);
        }
        if (storedConfirmationPending !== null) {
            confirmationPending = JSON.parse(storedConfirmationPending);
        }
        renderState();
    }
    function renderState() {
        renderFriendsGrid();
        spinButton.disabled = confirmationPending && friends.length !== 0;
        if (confirmationPending) {
            showPopup();
        }
    }
    function saveState() {
        localStorage.setItem('friends', JSON.stringify(friends));
        localStorage.setItem('selectedIdx', JSON.stringify(selectedIndex));
        localStorage.setItem('pending', JSON.stringify(confirmationPending));
    }
    // Load state and render grid on page load
    loadState();
});
