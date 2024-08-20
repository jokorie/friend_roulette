var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function calculatePriorityScore(friend) {
    const daysSinceLastContact = getDaysSinceLastContact(friend.lastContacted);
    const overdueBy = daysSinceLastContact - friend.cadence;
    const scoreOffset = 1; // so the scores from the first two days are different
    // Ensure there's a minimum weight, even if the contact is not overdue yet
    return Math.max(scoreOffset, overdueBy + scoreOffset);
}
function assignWeights(friends) {
    let totalPriority = 0;
    const friends_and_scores = friends.map(friend => {
        const priorityScore = calculatePriorityScore(friend);
        totalPriority += priorityScore;
        return [friend, priorityScore];
    });
    friends_and_scores.forEach(sublist => {
        sublist[1] /= totalPriority;
    });
    return friends_and_scores;
}
function weightedRandomSelection(friends_and_scores) {
    let r = Math.random(); // Generate a random number between 0 and 1
    let cumulative = 0;
    for (let i = 0; i < friends_and_scores.length; i++) {
        cumulative += friends_and_scores[i][1];
        if (r <= cumulative) {
            return friends_and_scores[i][0];
        }
    }
    // todo raise exception
    return friends_and_scores[0][0]; // Fallback (shouldn’t happen if weights are normalized)
}
function createFriend(name, cadence) {
    return {
        name,
        lastContacted: null,
        cadence, // Set the desired cadence in days
        instantiationDate: new Date(),
    };
}
function getDaysSinceLastContact(date) {
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
document.addEventListener('DOMContentLoaded', function () {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        // Load data from the backend and initialize the application
        let friendsData = yield loadDataFromBackend();
        let friends = friendsData.friends;
        let appState = friendsData.appState;
        let intervalId;
        const container = document.getElementById('container');
        const gridContainer = document.getElementById('grid-container');
        const spinButton = document.getElementById('spin-button');
        const confirmButton = document.getElementById('confirm-button');
        const popupMessage = document.getElementById('popup-message');
        const showAllCheckbox = document.getElementById('show-all');
        const cadenceSelector = document.getElementById('cadence-selector');
        const cadenceInput = document.getElementById('friend-cadence');
        // Event listener for cadence selection
        cadenceSelector.addEventListener('click', function (e) {
            const target = e.target;
            if (target.classList.contains('cadence-box')) {
                const alreadySelected = target.classList.contains('selected');
                // Remove 'selected' class from all boxes
                document.querySelectorAll('.cadence-box').forEach(box => {
                    box.classList.remove('selected');
                });
                if (!alreadySelected) {
                    // Add 'selected' class to the clicked box if it wasn't already selected
                    target.classList.add('selected');
                    // Update the hidden input with the selected cadence value
                    const selectedCadence = target.getAttribute('data-cadence');
                    if (selectedCadence) {
                        cadenceInput.value = selectedCadence;
                    }
                }
                else {
                    // Clear the cadence input if the box was already selected (deselect it)
                    cadenceInput.value = '';
                }
            }
        });
        // Event listener for custom cadence input focus or click
        (_a = document.getElementById('custom-cadence')) === null || _a === void 0 ? void 0 : _a.addEventListener('focus', function () {
            selectCustomCadenceBox();
        });
        (_b = document.getElementById('custom-cadence')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', function () {
            selectCustomCadenceBox();
        });
        function selectCustomCadenceBox() {
            var _a;
            const customCadenceInput = document.getElementById('custom-cadence');
            document.querySelectorAll('.cadence-box').forEach(box => {
                box.classList.remove('selected');
            });
            cadenceInput.value = "";
            (_a = customCadenceInput.parentElement) === null || _a === void 0 ? void 0 : _a.classList.add('selected');
            if (customCadenceInput.value) {
                cadenceInput.value = customCadenceInput.value;
            }
        }
        (_c = document.getElementById('add-friend')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const friendNameInput = document.getElementById('friend-name');
                const friendName = friendNameInput.value.trim();
                const cadence = parseInt(cadenceInput.value.trim(), 10);
                if (friendName && !isNaN(cadence)) {
                    yield addOrUpdateFriend(friendName, cadence);
                    renderFriendsGrid();
                    friendNameInput.value = '';
                    cadenceInput.value = '';
                }
            });
        });
        // Event listener for toggling the view
        showAllCheckbox.addEventListener('change', renderFriendsGrid);
        // Confirmation button event listener
        confirmButton.addEventListener('click', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const selectedFriend = friends.find((friend) => friend.name === appState.lastSelectedFriendName);
                if (selectedFriend !== undefined) {
                    selectedFriend.lastContacted = new Date(); // Update last contacted date
                    appState.confirmationPending = false; // No longer pending
                    spinButton.disabled = false; // Re-enable spin button
                    spinButton.classList.remove('disabled'); // Remove disabled styling
                    hidePopup(); // Hide the popup after confirmation
                    yield saveDataToBackend({ friends, appState });
                    friendsData = yield loadDataFromBackend(); // Refresh data from backend
                    friends = friendsData.friends;
                    renderFriendsGrid();
                }
            });
        });
        // Spin the wheel button event listener
        spinButton.addEventListener('click', spinWheel);
        function addOrUpdateFriend(friendName, cadence) {
            return __awaiter(this, void 0, void 0, function* () {
                const existingFriend = friends.find(friend => friend.name === friendName);
                if (existingFriend) {
                    existingFriend.lastContacted = null;
                    existingFriend.cadence = cadence;
                }
                else {
                    const newFriend = { name: friendName, lastContacted: null, cadence, instantiationDate: new Date() };
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
                console.log("before response");
                const response = yield fetch('http://localhost:3000/data');
                console.log(response);
                if (!response.ok) {
                    throw new Error('Failed to load data');
                }
                return yield response.json();
            });
        }
        function shouldRenderFriend(friend) {
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
            console.log("Rendering Friends");
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
        function spinWheel() {
            const eligibleFriends = friends.filter(friend => shouldRenderFriend(friend));
            if (intervalId || eligibleFriends.length === 0) {
                return;
            }
            const namesSet = new Set(eligibleFriends.map(friend => friend.name));
            const friend_and_weight = assignWeights(eligibleFriends);
            const selectedFriend = weightedRandomSelection(friend_and_weight);
            let currentHighlightIndex = 0;
            spinButton.disabled = true;
            let cycles = 6;
            intervalId = window.setInterval(() => {
                currentHighlightIndex = (currentHighlightIndex + 1) % friends.length;
                while (!namesSet.has(friends[currentHighlightIndex].name)) {
                    currentHighlightIndex = (currentHighlightIndex + 1) % friends.length;
                }
                appState.lastSelectedFriendName = friends[currentHighlightIndex].name;
                highlightSelected();
                if (friends[currentHighlightIndex] == selectedFriend)
                    cycles--;
                if (cycles === 0) {
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
                var _a;
                const nameElement = item.querySelector('.friend-name');
                const name = (_a = nameElement === null || nameElement === void 0 ? void 0 : nameElement.textContent) === null || _a === void 0 ? void 0 : _a.trim(); // Get the name from the grid item
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
            spinButton.classList.add('disabled'); // Apply disabled styling
        }
        // Function to hide the popup and enable the spin button
        function hidePopup() {
            container.classList.remove('split'); // Revert back to single panel layout
            appState.lastSelectedFriendName = "";
            console.log(appState.lastSelectedFriendName);
            confirmButton.disabled = true;
            highlightSelected(); // to unselect all
        }
        // Load state and render grid on page load
        renderFriendsGrid();
        if (appState.confirmationPending) {
            spinButton.classList.add('disabled'); // Apply disabled styling if confirmation is pending
            showPopup();
        }
    });
});
export {};
