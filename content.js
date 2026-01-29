// Biến toàn cục
let tooltip = null;
let hideTimer = null;
let activeWord = null; // Theo dõi từ đang được active

// Khởi tạo Tooltip
function createTooltip() {
    if (document.getElementById('ss-tooltip-global')) return;

    tooltip = document.createElement('div');
    tooltip.id = 'ss-tooltip-global';
    tooltip.className = 'ss-tooltip';

    // Logic chuột trên Tooltip:
    // 1. Vào tooltip -> Đừng ẩn nữa (để người dùng click loa, copy...)
    tooltip.addEventListener('mouseenter', () => {
        if (hideTimer) clearTimeout(hideTimer);
    });

    // 2. Rời tooltip -> Ẩn đi
    tooltip.addEventListener('mouseleave', () => {
        scheduleHide();
    });

    document.body.appendChild(tooltip);
}

// Hàm lên lịch ẩn (Có delay chút xíu để mượt mà)
function scheduleHide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        if (tooltip) tooltip.classList.remove('visible');
        activeWord = null; // Reset trạng thái
    }, 1000); // 1s delay: Cho phép người dùng thong thả di chuột hơn
}

// Hàm xử lý tương tác cho từng từ
function makeSubtitleInteractive(segmentElement) {
    if (!segmentElement) return;
    if (segmentElement.querySelector('.ss-interactive-word')) return;

    const originalText = segmentElement.textContent;
    if (!originalText || !originalText.trim()) return;

    segmentElement.innerHTML = '';
    const words = originalText.split(/(\s+)/);

    words.forEach(word => {
        if (!word.trim()) {
            segmentElement.appendChild(document.createTextNode(word));
        } else {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'ss-interactive-word';

            // --- SỰ KIỆN CHUỘT ---

            // 1. Click: Mở tooltip
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();

                // Đánh dấu từ này đang active
                activeWord = span;

                // Xóa hẹn giờ tắt (nếu có)
                if (hideTimer) clearTimeout(hideTimer);

                speakWord(word);
                handleWordClick(word, e.target);
            });

            // 2. Rời chuột khỏi từ: Hẹn giờ tắt
            span.addEventListener('mouseleave', () => {
                // Chỉ tắt nếu đây là từ đang mở tooltip
                if (activeWord === span) {
                    scheduleHide();
                }
            });

            // 3. (Tuỳ chọn) Di chuột lại vào từ: Hủy hẹn giờ tắt
            span.addEventListener('mouseenter', () => {
                if (activeWord === span && hideTimer) {
                    clearTimeout(hideTimer);
                }
            });

            segmentElement.appendChild(span);
        }
    });
}

// Xử lý logic gọi API
function handleWordClick(text, targetElement) {
    // Regex làm sạch từ kỹ lưỡng
    const cleanWord = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]<>]/g, "").trim();

    if (!cleanWord) return;

    showTooltip(targetElement, { loading: true });

    chrome.runtime.sendMessage({
        action: "translate",
        text: cleanWord
    }, (response) => {
        // Kiểm tra xem người dùng có còn đang focus vào từ đó không?
        // Nếu chuột đã đi chỗ khác rồi thì thôi, đừng hiện đè lên (UX tốt hơn)
        // Nhưng nếu người dùng đã rời chuột để tooltip tự ẩn thì thôi

        if (response) {
            showTooltip(targetElement, {
                word: cleanWord,
                translation: response.translatedText,
                phonetic: response.phonetic,
                example: response.example
            });
        } else {
            showTooltip(targetElement, { error: true });
        }
    });
}

// Hiển thị Tooltip
function showTooltip(targetElement, data) {
    if (!tooltip) createTooltip();

    // Xóa timer ẩn cũ để đảm bảo nó hiện lên
    if (hideTimer) clearTimeout(hideTimer);

    if (data.loading) {
        tooltip.innerHTML = `<div style="font-style:italic; color:#aaa; font-size:13px;">Wait...</div>`;
    } else if (data.error) {
        tooltip.innerHTML = `<div style="color:#ff6b6b; font-size:13px;">Error</div>`;
    } else {
        let phon = data.phonetic ? `<span style="font-size: 13px; color: #a5b4fc; font-style: italic;">${data.phonetic}</span>` : '';
        let ex = data.example ? `<div style="font-size: 12px; color: #d1d5db; font-style: italic; border-top: 1px solid #444; padding-top: 6px; margin-top: 6px; line-height: 1.4;">"${data.example}"</div>` : '';

        tooltip.innerHTML = `
            <div style="text-align: left; min-width: 150px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span id="ss-speaker-btn" style="font-size: 16px; cursor: pointer; transition: transform 0.1s;" title="Phát âm">🔊</span>
                    <strong style="font-size: 16px; color: #60a5fa;">${data.word || ''}</strong>
                    ${phon}
                </div>
                <div style="font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 2px;">
                    ${data.translation || '...'}
                </div>
                ${ex}
            </div>
        `;

        const speaker = document.getElementById('ss-speaker-btn');
        if (speaker && data.word) {
            speaker.onclick = (e) => {
                e.stopPropagation();
                speaker.style.transform = "scale(1.2)";
                setTimeout(() => speaker.style.transform = "scale(1)", 100);
                speakWord(data.word);
            };
        }
    }

    tooltip.classList.add('visible');

    // Tính toán vị trí
    const rect = targetElement.getBoundingClientRect();
    const top = rect.top - 20;
    const left = rect.left + (rect.width / 2);

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.transform = "translate(-50%, -100%) translateY(-10px)";
}

function speakWord(text) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.name.includes("Google US English"));
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
}

function startObserver() {
    createTooltip();
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => checkAndProcessNode(node));
            if (mutation.type === 'characterData') checkAndProcessNode(mutation.target.parentNode);
        });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function checkAndProcessNode(node) {
    if (!node) return;
    if (node.nodeType === 3) node = node.parentNode;
    if (node && node.classList && node.classList.contains('ytp-caption-segment')) {
        makeSubtitleInteractive(node);
    }
    if (node && node.querySelectorAll) {
        node.querySelectorAll('.ytp-caption-segment').forEach(seg => makeSubtitleInteractive(seg));
    }
}

setTimeout(() => {
    startObserver();
    console.log("Shadow Speak (Hover Mode) Activated");
}, 1000);
