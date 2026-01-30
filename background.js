// Background Service Worker

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // ------------------------------------------------------------------------
    // ACTION 1: TRANSLATE
    // ------------------------------------------------------------------------
    if (request.action === "translate") {
        const text = request.text;

        // 1. Hàm lấy nghĩa Tiếng Việt (Có cơ chế Backup)
        const getMeaningPromise = async () => {
            // Ưu tiên 1: Google Translate (Clients5)
            try {
                const urlGoogle = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=vi&q=${encodeURIComponent(text)}`;
                const res = await fetch(urlGoogle);
                if (res.status === 429) throw new Error("Rate Limited");
                if (!res.ok) throw new Error(`Google Error ${res.status}`);
                const data = await res.json();
                if (Array.isArray(data) && data[0]) return data[0];
            } catch (err) {
                console.warn("Google API failed, trying backup...", err);
            }

            // Ưu tiên 2: MyMemory API (Backup khi Google chặn)
            try {
                const urlMyMemory = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`;
                const res = await fetch(urlMyMemory);
                const data = await res.json();
                // MyMemory đôi khi trả về lỗi trong responseData
                if (data && data.responseData && data.responseData.translatedText) {
                    if (!data.responseData.translatedText.includes("MYMEMORY WARNING")) {
                        return data.responseData.translatedText;
                    }
                }
            } catch (err) {
                console.error("Backup failed", err);
            }

            return "Không tìm thấy nghĩa";
        };

        // 2. Hàm lấy Phiên âm & Ví dụ (Dictionary API)
        const getDictDetailsPromise = async () => {
            try {
                const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`);
                const data = await res.json();
                let result = { phonetic: "", example: "" };

                if (Array.isArray(data) && data.length > 0) {
                    const entry = data[0];
                    // Lấy phonetic
                    if (entry.phonetic) result.phonetic = entry.phonetic;
                    else if (entry.phonetics?.length) {
                        const p = entry.phonetics.find(p => p.text);
                        if (p) result.phonetic = p.text;
                    }
                    // Lấy example
                    if (entry.meanings) {
                        for (const m of entry.meanings) {
                            const def = m.definitions?.find(d => d.example);
                            if (def) {
                                result.example = def.example;
                                break;
                            }
                        }
                    }
                }
                return result;
            } catch (e) {
                return { phonetic: "", example: "" };
            }
        };

        // 3. Chạy song song và trả kết quả
        Promise.all([getMeaningPromise(), getDictDetailsPromise()])
            .then(([translatedText, dictData]) => {
                sendResponse({
                    translatedText: translatedText,
                    phonetic: dictData.phonetic,
                    example: dictData.example
                });
            })
            .catch(err => {
                console.error("Translation ERROR:", err);
                sendResponse(null); // Trả về null để bên kia biết là lỗi
            });

        return true; // Giữ kết nối async
    }

    // ------------------------------------------------------------------------
    // ACTION 2: SAVE WORD
    // ------------------------------------------------------------------------
    if (request.action === "save_word") {
        try {
            const newWord = request.data;
            if (!newWord || !newWord.text) {
                console.error("Invalid word data:", newWord);
                sendResponse({ success: false, message: "Invalid Data" });
                return true;
            }

            chrome.storage.local.get(["vocabList"], (result) => {
                const list = result.vocabList || [];
                // Check duplicate by text (case insensitive)
                const exists = list.some(w => w.text.toLowerCase() === newWord.text.toLowerCase());

                if (!exists) {
                    list.unshift(newWord);
                    chrome.storage.local.set({ vocabList: list }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Storage Error:", chrome.runtime.lastError);
                            sendResponse({ success: false, message: "Storage Error" });
                        } else {
                            console.log("Word saved successfully:", newWord.text);
                            sendResponse({ success: true });
                        }
                    });
                } else {
                    console.log("Duplicate word:", newWord.text);
                    sendResponse({ success: false, message: "Duplicate" });
                }
            });
        } catch (error) {
            console.error("Save Word Crash:", error);
            sendResponse({ success: false, message: error.message });
        }
        return true; // Keep async channel open
    }

    // ------------------------------------------------------------------------
    // ACTION 3: SPEAK (TEXT TO SPEECH)
    // ------------------------------------------------------------------------
    if (request.action === "speak") {
        const text = request.text;
        if (text) {
            chrome.tts.speak(text, {
                'lang': 'en-US',
                'rate': 1.0
            });
        }
        sendResponse({ success: true });
        return true;
    }
});
