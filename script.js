"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', function () {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        let friendsData = yield loadDataFromBackend();
        console.log(friendsData);
        let friends = friendsData.friends;
        let appState = friendsData.appState;
        let selectedIndex = appState.lastSelectedIndex;
        let currentHighlightIndex = 0;
        let intervalId;
        const gridContainer = document.getElementById('grid-container');
        const spinButton = document.getElementById('spin-button');
        const confirmButton = document.getElementById('confirm-button');
        const popupModal = document.getElementById('popup-modal');
        const popupMessage = document.getElementById('popup-message');
        (_a = document.getElementById('add-friend')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const friendNameInput = document.getElementById('friend-name');
                const friendName = friendNameInput.value.trim();
                if (friendName) {
                    yield addOrUpdateFriend(friendName);
                    friendsData = yield loadDataFromBackend(); // Refresh data from backend
                    friends = friendsData.friends;
                    renderFriendsGrid();
                    friendNameInput.value = '';
                }
            });
        });
        // Confirmation button event listener
        confirmButton.addEventListener('click', function () {
            return __awaiter(this, void 0, void 0, function* () {
                if (selectedIndex !== undefined) {
                    friends[selectedIndex].lastContacted = new Date(); // Update last contacted date
                    appState.confirmationPending = false; // No longer pending
                    yield saveDataToBackend({ friends, appState });
                    spinButton.disabled = false; // Re-enable spin button
                    hidePopup(); // Hide the popup after confirmation
                    friendsData = yield loadDataFromBackend(); // Refresh data from backend
                    friends = friendsData.friends;
                    renderFriendsGrid();
                }
            });
        });
        // Spin the wheel button event listener
        spinButton.addEventListener('click', spinWheel);
        function addOrUpdateFriend(friendName) {
            return __awaiter(this, void 0, void 0, function* () {
                const existingFriend = friends.find(friend => friend.name === friendName);
                if (existingFriend) {
                    existingFriend.lastContacted = null;
                }
                else {
                    const newFriend = { name: friendName, lastContacted: null };
                    friends.push(newFriend);
                }
                yield saveDataToBackend({ friends, appState });
            });
        }
        function saveDataToBackend(data) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch('http://localhost:3000/data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
            });
        }
        function loadDataFromBackend() {
            return __awaiter(this, void 0, void 0, function* () {
                const response = yield fetch('http://localhost:3000/data');
                if (!response.ok) {
                    throw new Error('Failed to load data');
                }
                return yield response.json();
            });
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
                    appState.confirmationPending = true;
                    appState.lastSelectedIndex = selectedIndex;
                    appState.confirmationPending = true;
                    showPopup(); // Show the popup after spinning
                    saveDataToBackend({ friends, appState }); // Save the updated state
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
        if (appState.confirmationPending)
            showPopup();
    });
});
