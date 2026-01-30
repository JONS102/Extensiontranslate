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

    segmentElement.textContent = ''; // Safe clear
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

    // Clear old content
    tooltip.textContent = '';

    if (data.loading) {
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = "font-style:italic; color:#aaa; font-size:13px;";
        loadingDiv.textContent = "Wait...";
        tooltip.appendChild(loadingDiv);
    } else if (data.error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = "color:#ff6b6b; font-size:13px;";
        errorDiv.textContent = "Error";
        tooltip.appendChild(errorDiv);
    } else {
        const container = document.createElement('div');
        container.style.cssText = "text-align: left; min-width: 150px;";

        const header = document.createElement('div');
        header.style.cssText = "display: flex; align-items: center; gap: 8px; margin-bottom: 4px;";

        // Speaker
        if (data.word) {
            const speaker = document.createElement('span');
            speaker.id = 'ss-speaker-btn';
            speaker.textContent = '🔊';
            speaker.style.cssText = "font-size: 16px; cursor: pointer; transition: transform 0.1s;";
            speaker.title = "Phát âm";
            speaker.onclick = (e) => {
                e.stopPropagation();
                speaker.style.transform = "scale(1.2)";
                setTimeout(() => speaker.style.transform = "scale(1)", 100);
                speakWord(data.word);
            };
            header.appendChild(speaker);
        }

        const wordNode = document.createElement('strong');
        wordNode.style.cssText = "font-size: 16px; color: #60a5fa;";
        wordNode.textContent = data.word || '';
        header.appendChild(wordNode);

        if (data.phonetic) {
            const phon = document.createElement('span');
            phon.style.cssText = "font-size: 13px; color: #a5b4fc; font-style: italic;";
            phon.textContent = data.phonetic;
            header.appendChild(phon);
        }

        // --- Save Button ---
        const saveBtn = document.createElement('span');
        // Dùng icon trái tim rỗng màu hồng/đỏ cho đẹp
        saveBtn.innerHTML = '&#9825;';
        saveBtn.title = "Lưu vào sổ tay";
        saveBtn.style.cssText = "font-size: 22px; cursor: pointer; margin-left: auto; color: #ff4757; line-height: 1; transition: all 0.2s;";

        saveBtn.onclick = (e) => {
            console.log("Click Save Button for:", data.word); // Debug Log
            e.stopPropagation();

            // Visual feedback immediately
            saveBtn.style.transform = "scale(1.2)";
            setTimeout(() => saveBtn.style.transform = "scale(1)", 200);

            chrome.runtime.sendMessage({
                action: "save_word",
                data: {
                    text: data.word,
                    meaning: data.translation,
                    phonetic: data.phonetic,
                    example: data.example
                }
            }, (res) => {
                console.log("Save response:", res); // Debug Log
                if (chrome.runtime.lastError) {
                    console.error("Runtime Error:", chrome.runtime.lastError);
                    alert("Lỗi kết nối Extension. Hãy reload lại trang!");
                    return;
                }

                if (res && res.success) {
                    saveBtn.innerHTML = '&#10084;'; // Trái tim đặc (Filled Red Heart)
                    saveBtn.style.transform = "scale(1.2)";
                    saveBtn.title = "Đã lưu";
                } else if (res && res.message === "Duplicate") {
                    saveBtn.innerHTML = '&#10084;';
                    saveBtn.title = "Đã có trong sổ tay";
                }
            });
        };
        header.appendChild(saveBtn);

        container.appendChild(header);

        const trans = document.createElement('div');
        trans.style.cssText = "font-size: 15px; font-weight: 600; color: #ffffff; margin-bottom: 2px;";
        trans.textContent = data.translation || '...';
        container.appendChild(trans);

        if (data.example) {
            const ex = document.createElement('div');
            ex.style.cssText = "font-size: 12px; color: #d1d5db; font-style: italic; border-top: 1px solid #444; padding-top: 6px; margin-top: 6px; line-height: 1.4;";
            ex.textContent = `"${data.example}"`;
            container.appendChild(ex);
        }

        tooltip.appendChild(container);
    }

    tooltip.classList.add('visible');
    tooltip.style.display = 'block'; // Force display to calculate rect correctly

    // Tính toán vị trí
    const rect = targetElement.getBoundingClientRect();
    const top = rect.top - 15; // Cách lên trên 1 chút
    const left = rect.left + (rect.width / 2);

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.transform = "translate(-50%, -100%)";
}

function speakWord(text) {
    if (!text) return;
    chrome.runtime.sendMessage({
        action: "speak",
        text: text
    });
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
