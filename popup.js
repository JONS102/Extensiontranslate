// popup.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const tabList = document.getElementById('tab-list');
    const tabFlashcard = document.getElementById('tab-flashcard');
    const viewList = document.getElementById('view-list');
    const viewFlashcard = document.getElementById('view-flashcard');
    const listContainer = document.getElementById('word-list');
    const emptyState = document.getElementById('list-empty');

    // Flashcard Elements
    const flashcard = document.getElementById('flashcard');
    const fcWord = document.getElementById('fc-word');
    const fcMeaning = document.getElementById('fc-meaning');
    const fcPhonetic = document.getElementById('fc-phonetic');
    const fcExample = document.getElementById('fc-example');
    const fcSpeaker = document.getElementById('fc-speak'); // New Speaker Button
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const fcCounter = document.getElementById('fc-counter');

    // --- State ---
    let words = [];
    let currentCardIndex = 0;

    // --- Tab Switching ---
    tabList.addEventListener('click', () => switchTab('list'));
    tabFlashcard.addEventListener('click', () => switchTab('flashcard'));

    function switchTab(tabName) {
        if (tabName === 'list') {
            tabList.classList.add('active');
            tabFlashcard.classList.remove('active');
            viewList.classList.add('active');
            viewFlashcard.classList.remove('active');
            renderList();
        } else {
            tabList.classList.remove('active');
            tabFlashcard.classList.add('active');
            viewList.classList.remove('active');
            viewFlashcard.classList.add('active');
            initFlashcard();
        }
    }

    // --- Load Data ---
    function loadWords(callback) {
        console.log("Loading words from storage...");
        chrome.storage.local.get(['vocabList'], (result) => {
            words = result.vocabList || [];
            console.log("Loaded words:", words);
            if (callback) callback();
        });
    }

    // --- List View Logic ---
    function renderList() {
        const debugStatus = document.getElementById('debug-status');
        if (debugStatus) debugStatus.textContent = "Updating List...";

        loadWords(() => {
            listContainer.innerHTML = ''; // Clear current list

            if (debugStatus) debugStatus.textContent = `Total words: ${words.length}`;

            // Handle Empty
            if (words.length === 0) {
                emptyState.style.display = 'block';
                return;
            }
            emptyState.style.display = 'none';

            // Render Items
            words.forEach((word, index) => {
                try {
                    const text = word.text || "Unknown";
                    const meaning = word.meaning || "...";

                    const li = document.createElement('li');
                    li.className = 'word-item';

                    // 1. Info Container
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'word-info';

                    // Heading + Speaker
                    const h3 = document.createElement('h3');
                    h3.textContent = text + " ";

                    const speakBtn = document.createElement('button');
                    speakBtn.className = 'list-speak-btn';
                    speakBtn.textContent = '🔊';
                    speakBtn.onclick = (e) => {
                        e.stopPropagation();
                        speakWord(text);
                    };

                    h3.appendChild(speakBtn);
                    infoDiv.appendChild(h3);

                    // Meaning
                    const p = document.createElement('p');
                    p.textContent = meaning;
                    infoDiv.appendChild(p);

                    li.appendChild(infoDiv);

                    // 2. Delete Button
                    const delBtn = document.createElement('button');
                    delBtn.className = 'btn-delete';
                    delBtn.title = 'Xóa từ này';
                    delBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;

                    delBtn.onclick = (e) => {
                        e.stopPropagation();
                        deleteWord(index);
                    };

                    li.appendChild(delBtn);

                    // Append to List
                    listContainer.appendChild(li);
                } catch (err) {
                    console.error("Error rendering word at index", index, err);
                }
            });
        });
    }

    function deleteWord(index) {
        if (confirm("Bạn có chắc muốn xóa từ này không?")) {
            words.splice(index, 1);
            chrome.storage.local.set({ vocabList: words }, () => {
                if (words.length === 0) {
                    // Update UI immediately for empty state
                    emptyState.style.display = 'block';
                    listContainer.innerHTML = '';
                } else {
                    renderList();
                }
            });
        }
    }

    // --- Flashcard Logic ---
    function initFlashcard() {
        loadWords(() => {
            if (words.length === 0) {
                // Handle empty state for flashcard?
                fcWord.textContent = "Trống";
                fcMeaning.textContent = "Chưa có từ nào";
                fcPhonetic.textContent = "";
                fcExample.textContent = "";
                fcCounter.textContent = "0 / 0";
                return;
            }
            currentCardIndex = 0;
            showCard(currentCardIndex);
        });
    }

    function showCard(index) {
        if (words.length === 0) return;

        // Reset flip
        flashcard.classList.remove('flipped');

        // Allow tight transition (wait for flip back if needed is better but let's keep simple)
        const word = words[index];
        fcWord.textContent = word.text;

        // Wait a tiny bit to update back face so user doesn't see it change while flipping if they are quick? 
        // No, standard is fine.
        setTimeout(() => {
            fcMeaning.textContent = word.meaning;
            fcPhonetic.textContent = word.phonetic || '';
            fcExample.textContent = word.example || '';
        }, 150);

        fcCounter.textContent = `${index + 1} / ${words.length}`;

        // Disable buttons if bounds
        btnPrev.disabled = index === 0;
        btnNext.disabled = index === words.length - 1;
        btnPrev.style.opacity = index === 0 ? 0.5 : 1;
        btnNext.style.opacity = index === words.length - 1 ? 0.5 : 1;
    }

    flashcard.addEventListener('click', (e) => {
        // Prevent flip if clicking speaker
        if (e.target.closest('#fc-speak')) return;

        if (words.length > 0) {
            flashcard.classList.toggle('flipped');
        }
    });

    if (fcSpeaker) {
        fcSpeaker.addEventListener('click', (e) => {
            e.stopPropagation();
            if (words.length > 0 && words[currentCardIndex]) {
                speakWord(words[currentCardIndex].text);
            }
        });
    }

    btnNext.addEventListener('click', () => {
        if (currentCardIndex < words.length - 1) {
            currentCardIndex++;
            showCard(currentCardIndex);
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            showCard(currentCardIndex);
        }
    });

    // --- Utils ---
    function escapeHtml(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function speakWord(text) {
        if (!text) return;
        // Delegate to Background for reliable TTS
        chrome.runtime.sendMessage({
            action: "speak",
            text: text
        });
    }

    // Initial load
    renderList();
});
